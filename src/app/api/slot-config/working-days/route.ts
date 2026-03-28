import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Update working days (Receptionist)
// PUT /api/slot-config/working-days
export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Receptionist', 'Admin']) as any;
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    const { workingDays } = await request.json();
    const tenantSharedKey = `shared_${hospital_id}`;

    const { data: config, error } = await supabase
      .from('slot_configs')
      .upsert({ 
        key: tenantSharedKey, 
        hospital_id,
        last_modified_by: profile?.id, 
        working_days: workingDays 
      }, { onConflict: 'key' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...config, _id: config.id, workingDays: config.working_days });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
