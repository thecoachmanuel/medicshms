import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const dob = searchParams.get('dob');
    const hospitalId = searchParams.get('hospitalId');

    if (!email || !dob || !hospitalId) {
      return NextResponse.json({ success: false, message: 'Email, DOB and Hospital ID are required' }, { status: 400 });
    }

    const { data: patient, error } = await (supabaseAdmin || supabase)
      .from('patients')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('email_address', email)
      .eq('date_of_birth', dob)
      .maybeSingle();

    if (error) throw error;

    if (!patient) {
      return NextResponse.json({ success: false, message: 'No matching patient found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        fullName: patient.full_name,
        gender: patient.gender,
        mobileNumber: patient.mobile_number,
        address: patient.address,
        emergencyContactName: patient.emergency_contact_name,
        emergencyContactNumber: patient.emergency_contact_number,
        patientId: patient.patient_id,
        knownAllergies: patient.known_allergies ? 'Yes' : 'No',
        allergiesDetails: patient.allergies_details,
        existingConditions: patient.existing_conditions
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
