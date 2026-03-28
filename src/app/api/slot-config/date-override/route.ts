import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Add/Update date override (Receptionist/Admin)
// POST /api/slot-config/date-override
export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Receptionist', 'Admin']) as any;
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    const { date, isHoliday, reason, customStartTime, customEndTime } = await request.json();
    if (!date) return NextResponse.json({ message: 'Date is required' }, { status: 400 });

    const tenantSharedKey = `shared_${hospital_id}`;

    let { data: config, error: configError } = await supabase
      .from('slot_configs')
      .select('*')
      .eq('key', tenantSharedKey)
      .single();

    if (configError && configError.code !== 'PGRST116') throw configError;

    if (!config) {
      const { data: created, error: insertError } = await (supabaseAdmin || supabase)
        .from('slot_configs')
        .insert([{ key: tenantSharedKey, hospital_id, last_modified_by: profile?.id }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      config = created;
    }

    const overrides = [...(config?.date_overrides || [])];
    const targetDate = new Date(date).toISOString().split('T')[0];

    const existingIdx = overrides.findIndex(o => {
      const d = new Date(o.date).toISOString().split('T')[0];
      return d === targetDate;
    });

    const override = { 
      id: existingIdx >= 0 ? (overrides[existingIdx].id || overrides[existingIdx]._id) : Math.random().toString(36).substr(2, 9),
      date: targetDate, 
      isHoliday: !!isHoliday, 
      reason: reason || '', 
      customStartTime: customStartTime || '', 
      customEndTime: customEndTime || '' 
    };

    if (existingIdx >= 0) {
      overrides[existingIdx] = override;
    } else {
      overrides.push(override);
    }

    overrides.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const { data: updated, error: updateError } = await supabase
      .from('slot_configs')
      .update({ 
        date_overrides: overrides, 
        last_modified_by: profile?.id 
      })
      .eq('id', config?.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return NextResponse.json({ ...updated, _id: updated.id, dateOverrides: updated.date_overrides });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
