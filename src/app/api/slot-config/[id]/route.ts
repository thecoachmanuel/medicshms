import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get single slot config (Admin only)
// GET /api/slot-config/:id
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { data: config, error } = await supabase
      .from('slot_configs')
      .select('*, profiles:last_modified_by(name, email, phone)')
      .eq('id', id)
      .single();

    if (error || !config) return NextResponse.json({ message: 'Slot config not found' }, { status: 404 });
    
    return NextResponse.json({ ...config, _id: config.id, lastModifiedBy: config.profiles });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Update slot config (Admin only)
// PUT /api/slot-config/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { workingDays, dateOverrides, minAdvanceBookingMinutes, sameDayCutoffTime } = await request.json();

    const updateData: any = {};
    if (workingDays !== undefined) updateData.working_days = workingDays;
    if (dateOverrides !== undefined) updateData.date_overrides = dateOverrides;
    if (minAdvanceBookingMinutes !== undefined) updateData.min_advance_booking_minutes = minAdvanceBookingMinutes;
    if (sameDayCutoffTime !== undefined) updateData.same_day_cutoff_time = sameDayCutoffTime;

    const { data: config, error } = await supabase
      .from('slot_configs')
      .update(updateData)
      .eq('id', id)
      .select('*, profiles:last_modified_by(name, email, phone)')
      .single();

    if (error || !config) return NextResponse.json({ message: 'Slot config not found' }, { status: 404 });

    return NextResponse.json({ ...config, _id: config.id, lastModifiedBy: config.profiles });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
