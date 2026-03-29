import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
    let query = supabase.from('patients').select('*, profiles!user_id(*)');
    
    // Check if id is UUID (very basic check)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('patient_id', id);
    }

    const { data: patient, error: pError } = await query.single();

    if (pError) return NextResponse.json({ message: pError.message }, { status: 404 });

    // Fetch appointment history with doctor names
    const { data: appointments, error: aError } = await supabase
      .from('public_appointments')
      .select('*, doctor:doctors!doctor_assigned_id(profiles!user_id(name))')
      .eq('patient_id', patient.patient_id)
      .order('appointment_date', { ascending: false });

    if (aError) return NextResponse.json({ message: aError.message }, { status: 500 });

    const formattedAppointments = (appointments || []).map(apt => ({
      ...apt,
      _id: apt.id,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      appointmentStatus: apt.appointment_status,
      visitType: apt.visit_type,
      reasonForVisit: apt.reason_for_visit,
      doctorName: (apt as any).doctor?.profiles?.name
    }));

    const formattedPatient = {
      ...patient,
      _id: patient.id,
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
  const { profile, error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  try {
    // Determine which ID type to use for the update
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabase.from('patients').update({
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
