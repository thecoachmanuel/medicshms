import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { calculateAge } from '@/lib/utils';

// GET patient details and history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await withAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    // Fetch patient info
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = (supabaseAdmin || supabase).from('patients').select('*, profiles!user_id(*)');
    
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('patient_id', id);
    }

    const { data: patient, error: pError } = await query.single();

    if (pError) {
      console.error('Patient fetch error:', pError);
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    // Fetch appointment history with doctor names using patient_id
    const { data: appointments, error: aError } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*, doctors!doctor_assigned_id(profiles!user_id(name))')
      .eq('patient_id', patient.patient_id)
      .order('appointment_date', { ascending: false });

    if (aError) {
      console.error('Appointments fetch error:', aError);
      return NextResponse.json({ message: aError.message }, { status: 500 });
    }

    const formattedAppointments = (appointments || []).map(apt => ({
      ...apt,
      _id: apt.id,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      appointmentStatus: apt.appointment_status,
      visitType: apt.visit_type,
      reasonForVisit: apt.reason_for_visit,
      doctor_notes: apt.doctor_notes,
      prescription: apt.prescription,
      doctorName: (apt as any).doctors?.profiles?.name
    }));

    const formattedPatient = {
      ...patient,
      _id: patient.id,
      patientId: patient.patient_id,
      fullName: patient.full_name,
      mobileNumber: patient.mobile_number,
      emailAddress: patient.email_address,
      dateOfBirth: patient.date_of_birth,
      bloodGroup: patient.blood_group,
      emergencyContactName: patient.emergency_contact_name,
      emergencyContactNumber: patient.emergency_contact_number,
      age: patient.age || calculateAge(patient.date_of_birth),
      appointments: formattedAppointments
    };

    return NextResponse.json({ data: formattedPatient });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH update patient details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error: authError } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor', 'Lab Scientist', 'Clinical Scientist', 'Radiologist', 'Pharmacist']);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  try {
    // Determine which ID type to use for the update
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let query = (supabaseAdmin || supabase).from('patients').update({
      full_name: body.fullName || body.full_name,
      email_address: body.emailAddress || body.email_address,
      mobile_number: body.mobileNumber || body.mobile_number,
      gender: body.gender,
      date_of_birth: body.dateOfBirth || body.date_of_birth,
      age: calculateAge(body.dateOfBirth || body.date_of_birth),
      address: body.address,
      blood_group: body.bloodGroup || body.blood_group,
      known_allergies: body.knownAllergies || body.known_allergies,
      allergies_details: body.allergiesDetails || body.allergies_details,
      existing_conditions: body.existingConditions || body.existing_conditions,
      emergency_contact_name: body.emergencyContactName || body.emergency_contact_name,
      emergency_contact_number: body.emergencyContactNumber || body.emergency_contact_number,
      updated_at: new Date().toISOString(),
    });

    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('patient_id', id);
    }

    const { data, error } = await query.select().single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ message: 'Patient not found' }, { status: 404 });

    return NextResponse.json({ 
      message: 'Patient updated successfully',
      data: { ...data, _id: data.id } 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE patient record
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabase.from('patients').delete();
    
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('patient_id', id);
    }

    const { error } = await query;

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
