import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Assign doctor to appointment (Admin, Receptionist)
// PATCH /api/admin-appointments/:id/assign-doctor
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  try {
    const { doctorId } = await request.json();
    const { id } = await params;

    const { data: appointment, error } = await supabase
      .from('public_appointments')
      .update({ doctor_assigned_id: doctorId, appointment_status: 'Confirmed' })
      .eq('id', id)
      .select()
      .single();

    if (error || !appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Doctor assigned successfully', data: { ...appointment, _id: appointment.id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
