import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { SlotService } from '@/lib/slot-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get('isPublic') === 'true';

  let resolvedHospitalId = searchParams.get('hospitalId');

  if (!isPublic) {
    const { error: authError, profile } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor']) as any;
    if (authError) return authError;
    if (!resolvedHospitalId && profile?.hospital_id) {
      resolvedHospitalId = profile.hospital_id;
    }
  }

  try {
    const date = searchParams.get('date');
    const hospitalId = resolvedHospitalId;
    const doctorId = searchParams.get('doctorId') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;

    if (!date || !hospitalId) {
      return NextResponse.json({ success: false, message: 'Date and Hospital ID are required' }, { status: 400 });
    }

    const { slots: timeSlots, bookingMode } = await SlotService.getAvailableSlots({
      date,
      hospitalId,
      doctorId,
      departmentId,
      isPublic
    });

    return NextResponse.json({ 
      success: true, 
      timeSlots,
      bookingMode
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch time slots' }, { status: 500 });
  }
}
