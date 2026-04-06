import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SlotService } from '@/lib/slot-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const hospitalId = searchParams.get('hospitalId');

    if (!date || !hospitalId) {
      return NextResponse.json({ success: false, message: 'Date and Hospital ID are required' }, { status: 400 });
    }

    const timeSlots = await SlotService.getAvailableSlots({
      date,
      hospitalId,
      isPublic: true
    });

    return NextResponse.json({ success: true, timeSlots });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch time slots' }, { status: 500 });
  }
}
