import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { SlotService } from '@/lib/slot-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get('isPublic') === 'true';

  if (!isPublic) {
    const { error: authError } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor']);
    if (authError) return authError;
  }

  try {
    const date = searchParams.get('date');
    const hospitalId = searchParams.get('hospitalId');
    const doctorId = searchParams.get('doctorId') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;

    if (!date || !hospitalId) {
      return NextResponse.json({ success: false, message: 'Date and Hospital ID are required' }, { status: 400 });
    }

    const timeSlots = await SlotService.getAvailableSlots({
      date,
      hospitalId,
      doctorId,
      departmentId,
      isPublic
    });

    return NextResponse.json({ 
      success: true, 
      timeSlots
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch time slots' }, { status: 500 });
  }
}
