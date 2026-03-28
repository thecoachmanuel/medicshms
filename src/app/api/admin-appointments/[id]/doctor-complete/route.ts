import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Doctor complete appointment (Doctor only)
// PATCH /api/admin-appointments/:id/doctor-complete
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
      .update({ appointment_status: 'Completed' })
      .eq('id', id)
      .eq('doctor_assigned_id', doctor.id)
      .select()
      .single();

    if (error || !appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found or not assigned to you' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Appointment marked as completed', data: { ...appointment, _id: appointment.id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
