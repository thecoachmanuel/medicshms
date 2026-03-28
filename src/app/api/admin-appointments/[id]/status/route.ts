import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor']);
  if (authError) return authError;

  try {
    const { status, reason } = await request.json();
    const { id } = await params;

    const updateData: any = { appointment_status: status };
    if (status === 'Cancelled' && reason) {
      updateData.cancel_reason = reason;
    }

    const { data: appointment, error } = await supabase
      .from('public_appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Status updated successfully', data: { ...appointment, _id: appointment.id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
