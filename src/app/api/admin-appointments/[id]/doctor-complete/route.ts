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

    // 1. Get Doctor ID if user is a doctor
    let doctorId = null;
    if (userProfile?.role === 'Doctor') {
      const { data: doctor } = await (supabaseAdmin || supabase)
        .from('doctors')
        .select('id')
        .eq('user_id', userProfile?.id)
        .single();
      doctorId = doctor?.id;
    }

    // 2. Perform Resilient Update
    let updateQuery = (supabaseAdmin || supabase)
      .from('public_appointments')
      .update({ 
        appointment_status: 'Completed',
        doctor_notes,
        prescription,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    // If it's a doctor, enforce assignment check (flexible for both doctor table ID and user UUID)
    if (userProfile?.role === 'Doctor') {
      if (doctorId) {
        updateQuery = updateQuery.or(`doctor_assigned_id.eq.${doctorId},doctor_assigned_id.eq.${userProfile.id}`);
      } else {
        updateQuery = updateQuery.eq('doctor_assigned_id', userProfile.id);
      }
    }

    const { data: appointment, error } = await updateQuery.select().single();

    if (error || !appointment) {
      console.error('[Doctor Complete Error]:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Appointment not found or you are not authorized to complete this specific session.' 
      }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Appointment marked as completed', data: { ...appointment, _id: appointment.id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
