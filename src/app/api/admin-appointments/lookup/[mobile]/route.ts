import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mobile: string }> }
) {
  const { error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  try {
    const { mobile } = await params;

    // Search for patient in public_appointments by mobile number
    // We get the latest record for this mobile number to pre-fill details
    const { data: patient, error } = await supabase
      .from('public_appointments')
      .select('*')
      .eq('mobile_number', mobile)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!patient) {
      return NextResponse.json({ success: false, message: 'No records found for this mobile number' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        fullName: patient.full_name,
        patientId: patient.patient_id,
        emailAddress: patient.email_address,
        mobileNumber: patient.mobile_number,
        gender: patient.gender,
        dateOfBirth: patient.date_of_birth,
        knownAllergies: patient.known_allergies,
        allergiesDetails: patient.allergies_details,
        existingConditions: patient.existing_conditions,
        address: patient.address,
      }
    });
  } catch (error: any) {
    console.error('Lookup error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
