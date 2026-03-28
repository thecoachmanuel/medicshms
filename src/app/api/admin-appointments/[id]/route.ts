import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor']);
  if (authError) return authError;

  try {
    const { id } = await params;
    const { data: appointment, error } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*, doctors:doctor_assigned_id(*, profiles:user_id(name))')
      .eq('id', id)
      .eq('hospital_id', profile?.hospital_id)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: appointment.id,
        appointmentId: appointment.appointment_id,
        fullName: appointment.full_name,
        patientId: appointment.patient_id,
        emailAddress: appointment.email_address,
        mobileNumber: appointment.mobile_number,
        gender: appointment.gender,
        dateOfBirth: appointment.date_of_birth,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        department: appointment.department,
        visitType: appointment.visit_type,
        appointmentStatus: appointment.appointment_status,
        knownAllergies: appointment.known_allergies ? 'Yes' : 'No',
        allergiesDetails: appointment.allergies_details,
        existingConditions: appointment.existing_conditions,
        address: appointment.address,
        doctorAssigned: {
          ...appointment.doctors,
          _id: appointment.doctors?.id,
          user: appointment.doctors?.profiles
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id } = await params;

    // Map frontend camelCase to database snake_case
    const updateData: any = {};
    if (body.fullName !== undefined) updateData.full_name = body.fullName;
    if (body.emailAddress !== undefined) updateData.email_address = body.emailAddress;
    if (body.mobileNumber !== undefined) updateData.mobile_number = body.mobileNumber;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.dateOfBirth !== undefined) updateData.date_of_birth = body.dateOfBirth;
    if (body.appointmentDate !== undefined) updateData.appointment_date = body.appointmentDate;
    if (body.appointmentTime !== undefined) updateData.appointment_time = body.appointmentTime;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.doctorAssignedId !== undefined) updateData.doctor_assigned_id = body.doctorAssignedId;
    if (body.visitType !== undefined) updateData.visit_type = body.visitType;
    if (body.reasonForVisit !== undefined) updateData.reason_for_visit = body.reasonForVisit;
    if (body.primaryConcern !== undefined) updateData.primary_concern = body.primaryConcern;
    if (body.knownAllergies !== undefined) {
      updateData.known_allergies = body.knownAllergies === 'Yes' || body.knownAllergies === true;
    }
    if (body.allergiesDetails !== undefined) updateData.allergies_details = body.allergiesDetails;
    if (body.existingConditions !== undefined) updateData.existing_conditions = body.existingConditions;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.appointmentStatus !== undefined) updateData.appointment_status = body.appointmentStatus;

    // Logic for resetting doctor if department changes
    if (updateData.department) {
      const { data: current } = await (supabaseAdmin || supabase)
        .from('public_appointments')
        .select('department, appointment_status')
        .eq('id', id)
        .eq('hospital_id', profile?.hospital_id)
        .single();
      if (current && current.department !== updateData.department) {
        updateData.doctor_assigned_id = null;
        if (current.appointment_status === 'Confirmed') {
          updateData.appointment_status = 'Pending';
        }
      }
    }

    const { data: appointment, error } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .update(updateData)
      .eq('id', id)
      .eq('hospital_id', profile?.hospital_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Appointment updated successfully', data: { ...appointment, _id: appointment.id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const { id } = await params;
    const { error } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .delete()
      .eq('id', id)
      .eq('hospital_id', profile?.hospital_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
