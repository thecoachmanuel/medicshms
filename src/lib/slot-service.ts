import { supabaseAdmin, supabase } from './supabase';

export interface WorkingDay {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface SlotOptions {
  date: string;
  hospitalId: string;
  doctorId?: string;
  departmentId?: string;
  isPublic?: boolean;
}

export const SlotService = {
  /**
   * Generates available time slots for a specific date and context.
   * Hierarchical fallback: Doctor -> Department -> Global Hospital Defaults
   */
  async getAvailableSlots(options: SlotOptions) {
    const { date, hospitalId, doctorId, departmentId } = options;
    const client = (supabaseAdmin || supabase);

    // 1. Fetch Configuration Hierarchy
    const [globalDefaults, sharedConfig, doctorConfig] = await Promise.all([
      client.from('slot_defaults').select('*').eq('hospital_id', hospitalId).eq('key', `global_${hospitalId}`).maybeSingle(),
      client.from('slot_configs').select('*').eq('hospital_id', hospitalId).eq('key', `shared_${hospitalId}`).maybeSingle(),
      doctorId ? client.from('slot_configs').select('*').eq('hospital_id', hospitalId).eq('key', `doctor_${doctorId}`).maybeSingle() : Promise.resolve({ data: null })
    ]);

    const defaults = globalDefaults.data;
    const config = doctorConfig.data || sharedConfig.data;

    if (!defaults) return [];

    // 2. Determine Day Availability
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    const workingDay = (config?.working_days || [])?.find((d: WorkingDay) => d.day === dayName);
    
    if (workingDay && !workingDay.enabled) return [];

    // Fallback logic for timing
    const startTime = workingDay?.startTime || defaults.default_working_hours_start || '09:00';
    const endTime = workingDay?.endTime || defaults.default_working_hours_end || '17:00';
    const breakStart = workingDay?.breakStart || defaults.default_break_start;
    const breakEnd = workingDay?.breakEnd || defaults.default_break_end;
    const slotDuration = defaults.default_slot_duration_minutes || 30;

    // 3. (Optional) Check Holidays/Overrides
    const dateOverrides = config?.date_overrides || [];
    const isHoliday = dateOverrides.find((o: any) => o.date === date && o.isClosed);
    if (isHoliday) return [];

    // 4. Generate Base Slots
    const slots: string[] = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const current = new Date(date);
    current.setHours(startH, startM, 0, 0);
    
    const end = new Date(date);
    end.setHours(endH, endM, 0, 0);

    // 5. Fetch Existing Bookings to prevent double-booking
    const { data: bookings } = await client
      .from('public_appointments')
      .select('appointment_time')
      .eq('hospital_id', hospitalId)
      .eq('appointment_date', date)
      .not('appointment_status', 'eq', 'Cancelled');

    const bookedTimes = new Set((bookings || []).map(b => {
       // Standardize time format for comparison (ensure it matches our generator)
       const t = b.appointment_time;
       return t; 
    }));

    while (current < end) {
      const timeStr = current.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });

      // Check for breaks
      let inBreak = false;
      if (breakStart && breakEnd) {
        const bStart = new Date(date);
        const [bsH, bsM] = breakStart.split(':').map(Number);
        bStart.setHours(bsH, bsM, 0, 0);

        const bEnd = new Date(date);
        const [beH, beM] = breakEnd.split(':').map(Number);
        bEnd.setHours(beH, beM, 0, 0);

        if (current >= bStart && current < bEnd) inBreak = true;
      }

      // Check if already booked
      const isBooked = bookedTimes.has(timeStr);

      if (!inBreak && !isBooked) {
        slots.push(timeStr);
      }

      current.setMinutes(current.getMinutes() + slotDuration);
    }

    return slots;
  }
};
