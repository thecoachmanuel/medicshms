import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get global defaults (Admin only)
// GET /api/slot-config/defaults
export async function GET(request: Request) {
  const { error: authError, profile, supabase: scopedSupabase } = await withAuth(request, ['Admin']) as any;
  if (authError) return authError;

  const db = scopedSupabase || supabase;

  const hospital_id = profile?.hospital_id;

  try {
    // Suffix workaround to bypass UNIQUE(key) constraint in DB for multi-tenancy
    const tenantKey = `global_${hospital_id}`;

    let { data: defaults, error } = await db
      .from('slot_defaults')
      .select('*')
      .eq('key', tenantKey)
      .single();

    if ((error && error.code === 'PGRST116') || !defaults) {
      const { data: created, error: insertError } = await (supabaseAdmin || db)
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
  const { error: authError, profile, supabase: scopedSupabase } = await withAuth(request, ['Admin']) as any;
  if (authError) return authError;

  const db = scopedSupabase || supabase;

  const hospital_id = profile?.hospital_id;

  try {
    const body = await request.json();
    const {
      max_booking_window_days,
      default_slot_duration_minutes,
      default_working_hours_start,
      default_working_hours_end,
      default_break_start,
      default_break_end,
      default_daily_capacity,
      default_booking_mode
    } = body;

    const tenantKey = `global_${hospital_id}`;
    const updateData: any = { 
      key: tenantKey,
      hospital_id 
    };
    if (max_booking_window_days !== undefined) updateData.max_booking_window_days = max_booking_window_days;
    if (default_slot_duration_minutes !== undefined) updateData.default_slot_duration_minutes = default_slot_duration_minutes;
    if (default_working_hours_start !== undefined) updateData.default_working_hours_start = default_working_hours_start;
    if (default_working_hours_end !== undefined) updateData.default_working_hours_end = default_working_hours_end;
    if (default_break_start !== undefined) updateData.default_break_start = default_break_start;
    if (default_break_end !== undefined) updateData.default_break_end = default_break_end;
    if (default_daily_capacity !== undefined) updateData.default_daily_capacity = default_daily_capacity;
    if (default_booking_mode !== undefined) updateData.default_booking_mode = default_booking_mode;

    const { data: defaults, error } = await db
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
