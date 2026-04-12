import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Doctor complete appointment (Doctor only)
// PATCH /api/admin-appointments/:id/doctor-complete
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Doctor', 'Admin']);
  if (authError) return authError;

  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Handle empty body gracefully
    }
    const { doctor_notes, prescription } = body as any;
    const { id } = await params;
    const client = (supabaseAdmin || supabase);

    // 1. PHASE A: DISCOVERY - Fetch Appointment & Doctor Record
    const [appointmentFetch, doctorFetch] = await Promise.all([
      client.from('public_appointments').select('*').eq('id', id).single(),
      userProfile?.role === 'Doctor' 
        ? client.from('doctors').select('id').eq('user_id', userProfile?.id).single()
        : Promise.resolve({ data: null })
    ]);

    const appointment = appointmentFetch.data;
    const doctor = doctorFetch.data;

    // 2. PHASE B: VALIDATION MATRIX
    if (!appointment) {
      return NextResponse.json({ success: false, message: 'Appointment ticket not found' }, { status: 404 });
    }

    // 2.1 Hospital Isolation Check
    if (appointment.hospital_id !== userProfile?.hospital_id) {
      console.error('[Auth Denied] Hospital Mismatch:', { appointmentHosp: appointment.hospital_id, userHosp: userProfile?.hospital_id });
      return NextResponse.json({ success: false, message: 'Cross-hospital access denied' }, { status: 403 });
    }

    // 2.2 Role-Based Assignment Check
    let isAuthorized = false;
    if (userProfile?.role === 'Admin') {
      isAuthorized = true; // Admins have master completion rights
    } else if (userProfile?.role === 'Doctor') {
      const assignedId = appointment.doctor_assigned_id;
      // Authorize if assignedId matches either the doctor record ID or the user UUID
      if (assignedId === doctor?.id || assignedId === userProfile.id) {
        isAuthorized = true;
      } else {
        console.error('[Auth Denied] Doctor Mismatch:', { assignedId, doctorId: doctor?.id, userId: userProfile.id });
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ 
        success: false, 
        message: 'You are not authorized to finalize this specific clinical session.' 
      }, { status: 403 });
    }

    // 3. PHASE C: FINALIZED UPDATE
    const { data: updatedApt, error: updateError } = await client
      .from('public_appointments')
      .update({ 
        appointment_status: 'Completed',
        doctor_notes,
        prescription,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, message: 'Appointment marked as completed', data: { ...updatedApt, _id: updatedApt.id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
