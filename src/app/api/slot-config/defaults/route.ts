import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get global defaults (Admin only)
// GET /api/slot-config/defaults
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']) as any;
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    // Suffix workaround to bypass UNIQUE(key) constraint in DB for multi-tenancy
    const tenantKey = `global_${hospital_id}`;

    let { data: defaults, error } = await supabase
      .from('slot_defaults')
      .select('*')
      .eq('key', tenantKey)
      .single();

    if (error || !defaults) {
      const { data: created, error: insertError } = await (supabaseAdmin || supabase)
        .from('slot_defaults')
        .insert([{ key: tenantKey, hospital_id }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      defaults = created;
    }

    return NextResponse.json({
      ...defaults,
      _id: defaults?.id,
      maxBookingWindowDays: defaults?.max_booking_window_days,
      defaultSlotDurationMinutes: defaults?.default_slot_duration_minutes,
      defaultWorkingHoursStart: defaults?.default_working_hours_start,
      defaultWorkingHoursEnd: defaults?.default_working_hours_end,
      defaultBreakStart: defaults?.default_break_start,
      defaultBreakEnd: defaults?.default_break_end,
      defaultDailyCapacity: defaults?.default_daily_capacity
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Update global defaults (Admin only)
// PUT /api/slot-config/defaults
export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']) as any;
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    const {
      maxBookingWindowDays,
      defaultSlotDurationMinutes,
      defaultWorkingHoursStart,
      defaultWorkingHoursEnd,
      defaultBreakStart,
      defaultBreakEnd,
      defaultDailyCapacity
    } = await request.json();

    const tenantKey = `global_${hospital_id}`;
    const updateData: any = { 
      key: tenantKey,
      hospital_id 
    };
    if (maxBookingWindowDays !== undefined) updateData.max_booking_window_days = maxBookingWindowDays;
    if (defaultSlotDurationMinutes !== undefined) updateData.default_slot_duration_minutes = defaultSlotDurationMinutes;
    if (defaultWorkingHoursStart !== undefined) updateData.default_working_hours_start = defaultWorkingHoursStart;
    if (defaultWorkingHoursEnd !== undefined) updateData.default_working_hours_end = defaultWorkingHoursEnd;
    if (defaultBreakStart !== undefined) updateData.default_break_start = defaultBreakStart;
    if (defaultBreakEnd !== undefined) updateData.default_break_end = defaultBreakEnd;
    if (defaultDailyCapacity !== undefined) updateData.default_daily_capacity = defaultDailyCapacity;

    const { data: defaults, error } = await supabase
      .from('slot_defaults')
      .upsert(updateData, { onConflict: 'key' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ...defaults, _id: defaults?.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
