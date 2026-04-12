import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get shared slot config (Receptionist)
// GET /api/slot-config/my-config
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Receptionist', 'Admin', 'Doctor']) as any;
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    const isDoctor = profile?.role === 'Doctor';
    let doctorId = null;
    
    if (isDoctor) {
      const { data: doctorRecord } = await (supabaseAdmin || supabase)
        .from('doctors')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      doctorId = doctorRecord?.id;
    }

    const tenantSharedKey = doctorId ? `doctor_${doctorId}` : `shared_${hospital_id}`;
    const tenantGlobalKey = `global_${hospital_id}`;

    let { data: config, error: configError } = await supabase
      .from('slot_configs')
      .select('*')
      .eq('key', tenantSharedKey)
      .single();

    // Auto-create with defaults if not exists
    if (configError || !config) {
      const { data: defaults } = await supabase
        .from('slot_defaults')
        .select('*')
        .eq('key', tenantGlobalKey)
        .single();
        
      const defaultStart = defaults?.default_working_hours_start || '09:00';
      const defaultEnd = defaults?.default_working_hours_end || '17:00';
      const defaultBreakStart = defaults?.default_break_start || '13:00';
      const defaultBreakEnd = defaults?.default_break_end || '14:00';

      const newConfig: any = {
        key: tenantSharedKey,
        hospital_id,
        last_modified_by: profile?.id,
        working_days: [
          { day: 'monday', enabled: true, startTime: defaultStart, endTime: defaultEnd, breakStart: defaultBreakStart, breakEnd: defaultBreakEnd },
          { day: 'tuesday', enabled: true, startTime: defaultStart, endTime: defaultEnd, breakStart: defaultBreakStart, breakEnd: defaultBreakEnd },
          { day: 'wednesday', enabled: true, startTime: defaultStart, endTime: defaultEnd, breakStart: defaultBreakStart, breakEnd: defaultBreakEnd },
          { day: 'thursday', enabled: true, startTime: defaultStart, endTime: defaultEnd, breakStart: defaultBreakStart, breakEnd: defaultBreakEnd },
          { day: 'friday', enabled: true, startTime: defaultStart, endTime: defaultEnd, breakStart: defaultBreakStart, breakEnd: defaultBreakEnd },
          { day: 'saturday', enabled: false, startTime: defaultStart, endTime: '13:00', breakStart: '', breakEnd: '' },
          { day: 'sunday', enabled: false, startTime: '', endTime: '', breakStart: '', breakEnd: '' }
        ],
        booking_mode: defaults?.default_booking_mode || 'Slot',
        sessions: defaults?.default_sessions || []
      };

      if (doctorId) {
        newConfig.doctor_id = doctorId;
      }

      const { data: created, error: createError } = await (supabaseAdmin || supabase)
        .from('slot_configs')
        .insert([newConfig])
        .select()
        .single();
        
      if (createError) throw createError;
      config = created;
    }

    // Attach maxBookingWindowDays from global defaults
    const { data: globalDefaults } = await supabase
      .from('slot_defaults')
      .select('*')
      .eq('key', tenantGlobalKey)
      .single();
    
    const result = {
      ...config,
      _id: config.id,
      workingDays: config.working_days,
      dateOverrides: config.date_overrides,
      bookingMode: config.booking_mode || 'Slot',
      sessions: config.sessions || [],
      minAdvanceBookingMinutes: config.min_advance_booking_minutes,
      sameDayCutoffTime: config.same_day_cutoff_time,
      maxBookingWindowDays: globalDefaults?.max_booking_window_days || 20
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Update shared slot config
// PUT /api/slot-config/my-config
export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Receptionist', 'Admin', 'Doctor']) as any;
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    const { workingDays, dateOverrides, minAdvanceBookingMinutes, sameDayCutoffTime, bookingMode, sessions, doctorId: targetDoctorId } = await request.json();
    
    const isDoctor = profile?.role === 'Doctor';
    let doctorId = null;
    
    if (isDoctor) {
      const { data: doctorRecord } = await (supabaseAdmin || supabase)
        .from('doctors')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      doctorId = doctorRecord?.id;
    } else {
      doctorId = targetDoctorId;
    }

    const tenantSharedKey = doctorId ? `doctor_${doctorId}` : `shared_${hospital_id}`;

    const updateData: any = {
      last_modified_by: profile?.id,
      hospital_id
    };
    if (workingDays !== undefined) updateData.working_days = workingDays;
    if (dateOverrides !== undefined) updateData.date_overrides = dateOverrides;
    if (minAdvanceBookingMinutes !== undefined) updateData.min_advance_booking_minutes = minAdvanceBookingMinutes;
    if (sameDayCutoffTime !== undefined) updateData.same_day_cutoff_time = sameDayCutoffTime;
    if (bookingMode !== undefined) updateData.booking_mode = bookingMode;
    if (sessions !== undefined) updateData.sessions = sessions;
    if (doctorId) updateData.doctor_id = doctorId;

    const { data: config, error } = await supabase
      .from('slot_configs')
      .upsert({ ...updateData, key: tenantSharedKey }, { onConflict: 'key' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ 
      ...config, 
      _id: config.id, 
      workingDays: config.working_days, 
      dateOverrides: config.date_overrides,
      bookingMode: config.booking_mode,
      sessions: config.sessions
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
