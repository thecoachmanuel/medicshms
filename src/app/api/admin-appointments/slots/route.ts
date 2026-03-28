import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get('isPublic') === 'true';

  if (!isPublic) {
    const { error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
    if (authError) return authError;
  }

  try {
    const date = searchParams.get('date');
    const hospitalId = searchParams.get('hospitalId');

    if (!date) {
      return NextResponse.json({ success: false, message: 'Date is required' }, { status: 400 });
    }

    // 1. Fetch Slot Settings
    let query = supabase.from('slot_defaults').select('*');
    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    } else {
      query = query.eq('key', 'global');
    }

    const { data: settings, error: settingsError } = await query.maybeSingle();
    
    // Fallback constants if not configured
    const slotDuration = settings?.default_slot_duration_minutes || 30;
    const startTime = settings?.default_working_hours_start || '09:00';
    const endTime = settings?.default_working_hours_end || '17:00';

    // 2. Generate Slots
    const timeSlots: string[] = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let current = new Date();
    current.setHours(startH, startM, 0, 0);
    
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    while (current < end) {
      const timeStr = current.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
      timeSlots.push(timeStr);
      current.setMinutes(current.getMinutes() + slotDuration);
    }

    // 3. (Optional) Filter out already booked slots
    // For now, return all based on configuration as requested to "make it work"
    return NextResponse.json({ 
      success: true, 
      timeSlots,
      config: { slotDuration, startTime, endTime }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch time slots' }, { status: 500 });
  }
}
