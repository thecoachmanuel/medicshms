import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Doctor remove self from appointment (Doctor only)
// PATCH /api/admin-appointments/:id/doctor-remove
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Doctor']);
  if (authError) return authError;

  try {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userProfile?.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ success: false, message: 'Doctor profile not found' }, { status: 404 });
    }

    const { id } = await params;
    const { data: appointment, error } = await supabase
      .from('public_appointments')
      .update({ doctor_assigned_id: null, appointment_status: 'Pending' })
      .eq('id', id)
      .eq('doctor_assigned_id', doctor.id)
      .select()
      .single();

    if (error || !appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found or not assigned to you' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Successfully removed yourself from the appointment', data: { ...appointment, _id: appointment.id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
