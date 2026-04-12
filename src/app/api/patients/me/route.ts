import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { profile: userProfile, error: authError, supabase: supabaseClient } = await withAuth(request, ['Patient']);
    if (authError || !supabaseClient) return authError;

    // 1. Find the patient record linked to this user
    const { data: patient, error: patientError } = await (supabaseAdmin || supabaseClient)
      .from('patients')
      .select('*')
      .eq('user_id', userProfile?.id)
      .maybeSingle();

    if (patientError) {
      console.error(`[Patient Me API] Database error for UUID ${userProfile?.id}:`, patientError.message);
      return NextResponse.json({ message: patientError.message }, { status: 500 });
    }
    if (!patient) {
      console.warn(`[Patient Me API] No patient record found for user UUID ${userProfile?.id}. Expected link in 'patients' table missing.`);
      return NextResponse.json({ message: 'Patient profile not found. Please contact administration to link your account.' }, { status: 404 });
    }

    // 2. Fetch all related data in parallel for the dashboard
    const [vitalsRes, requestsRes, appointmentsRes, prescriptionsRes, billsRes] = await Promise.all([
      // Vitals
      supabaseClient.from('patient_vitals').select('*').eq('patient_id', patient.id).order('recorded_at', { ascending: false }),
      // Clinical Requests (Lab/Radiology) with Bill payment status
      supabaseClient.from('clinical_requests').select('*, bills(payment_status, total_amount)').eq('patient_id', patient.id).order('requested_at', { ascending: false }),
      // Appointments
      supabaseClient.from('public_appointments').select('*').eq('patient_id', patient.id).order('appointment_date', { ascending: false }),
      // Prescriptions
      supabaseClient.from('prescriptions').select('*').eq('patient_id', patient.id).order('prescribed_at', { ascending: false }),
      // Invoices
      supabaseClient.from('bills').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false })
    ]);

    return NextResponse.json({
      profile: {
        ...patient,
        fullName: patient.full_name,
        patientId: patient.patient_id,
        email: patient.email_address,
        phone: patient.mobile_number
      },
      vitals: vitalsRes.data || [],
      requests: requestsRes.data || [],
      appointments: appointmentsRes.data || [],
      prescriptions: prescriptionsRes.data || [],
      bills: billsRes.data || []
    });

  } catch (error: any) {
    console.error('[Patient Me API Error]:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
