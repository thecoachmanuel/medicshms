import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { error: authError } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor']);
  if (authError) return authError;

  const { patientId } = await params;

  try {
    const { data: appointments, error } = await supabase
      .from('public_appointments')
      .select('*, doctors:doctor_assigned_id(*, profiles:user_id(name, email))')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    if (error || !appointments || appointments.length === 0) {
      return NextResponse.json({ success: false, message: 'Patient not found' }, { status: 404 });
    }

    const latest = appointments[0];
    const allAppointments = appointments.map(apt => ({
      _id: apt.id,
      appointmentId: apt.appointment_id,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      department: apt.department,
      appointmentStatus: apt.appointment_status,
      visitType: apt.visit_type,
      doctorAssigned: {
        ...apt.doctors,
        user: apt.doctors?.profiles
      },
      reasonForVisit: apt.reason_for_visit || apt.primary_concern,
      createdAt: apt.created_at,
      cancelReason: apt.cancel_reason,
    }));

    return NextResponse.json({
      success: true,
      data: {
        patientId: latest.patient_id,
        fullName: latest.full_name,
        emailAddress: latest.email_address,
        mobileNumber: latest.mobile_number,
        gender: latest.gender,
        dateOfBirth: latest.date_of_birth,
        age: latest.age,
        knownAllergies: latest.known_allergies,
        allergiesDetails: latest.allergies_details,
        existingConditions: latest.existing_conditions,
        address: latest.address,
        emergencyContactName: latest.emergency_contact_name,
        emergencyContactNumber: latest.emergency_contact_number,
        totalAppointments: appointments.length,
        appointments: allAppointments,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Update patient medical info (Admin, Receptionist)
// PUT /api/patients/public-appointments/:patientId
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  const { patientId } = await params;

  try {
    const { knownAllergies, allergiesDetails, existingConditions } = await request.json();

    const { error } = await supabase
      .from('public_appointments')
      .update({ 
        known_allergies: knownAllergies, 
        allergies_details: allergiesDetails, 
        existing_conditions: existingConditions 
      })
      .eq('patient_id', patientId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Medical information updated'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
