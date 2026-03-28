import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Update booking rules (Receptionist)
// PUT /api/slot-config/booking-rules
export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Receptionist', 'Admin']) as any;
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    const { minAdvanceBookingMinutes, sameDayCutoffTime } = await request.json();
    const tenantSharedKey = `shared_${hospital_id}`;

    const updateData: any = { 
      key: tenantSharedKey, 
      hospital_id,
      last_modified_by: profile?.id 
    };
    if (minAdvanceBookingMinutes !== undefined) updateData.min_advance_booking_minutes = minAdvanceBookingMinutes;
    if (sameDayCutoffTime !== undefined) updateData.same_day_cutoff_time = sameDayCutoffTime;

    const { data: config, error } = await supabase
      .from('slot_configs')
      .upsert(updateData, { onConflict: 'key' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...config, _id: config.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
