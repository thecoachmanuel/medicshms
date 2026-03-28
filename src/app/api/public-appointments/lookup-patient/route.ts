import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('mobile');
    if (!mobile) {
      return NextResponse.json({ success: false, message: 'Mobile number is required' }, { status: 400 });
    }

    const { data: appointment, error } = await supabase
      .from('public_appointments')
      .select('*')
      .eq('mobile_number', mobile)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !appointment) {
      return NextResponse.json({ success: false, message: 'No patient found with this mobile number' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        fullName: appointment.full_name,
        gender: appointment.gender,
        dateOfBirth: appointment.date_of_birth,
        age: appointment.age,
        ageMonths: appointment.age_months,
        emailAddress: appointment.email_address,
        mobileNumber: appointment.mobile_number,
        knownAllergies: appointment.known_allergies,
        allergiesDetails: appointment.allergies_details,
        existingConditions: appointment.existing_conditions,
        address: appointment.address,
        emergencyContactName: appointment.emergency_contact_name,
        emergency_contact_number: appointment.emergency_contact_number,
        patientId: appointment.patient_id,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to lookup patient' }, { status: 500 });
  }
}
