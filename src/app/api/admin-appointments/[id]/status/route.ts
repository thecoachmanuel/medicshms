import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status, reason } = await request.json();
    const { id } = await params;
    const { error: authError, profile } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor']);
    if (authError) return authError;

    const updateData: any = { 
      appointment_status: status,
      is_calling: false,
      called_at: null
    };
    if (status === 'Cancelled' && reason) {
      updateData.cancel_reason = reason;
    }

    // Auto-assign doctor on approval if not assigned
    if (status === 'Confirmed' && profile?.role === 'Doctor') {
      const { data: current } = await (supabaseAdmin || supabase)
        .from('public_appointments')
        .select('doctor_assigned_id')
        .eq('id', id)
        .single();
      
      if (current && !current.doctor_assigned_id) {
        const { data: doctor } = await (supabaseAdmin || supabase)
          .from('doctors')
          .select('id')
          .eq('user_id', profile.id)
          .single();
        
        if (doctor) {
          updateData.doctor_assigned_id = doctor.id;
        }
      }
    }

    const { data: appointment, error } = await (supabaseAdmin || supabase)
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
