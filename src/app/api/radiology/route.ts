import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { BillingService } from '@/lib/billing-service';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Radiologist', 'Doctor', 'Admin']);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const status = searchParams.get('status');

  try {
    let query = (supabaseAdmin || supabase)
      .from('clinical_requests')
      .select(`
        *,
        patient:patient_id(full_name, patient_id),
        doctor_profile:doctor_id(name),
        handled_by_profile:handled_by(name)
      `)
      .eq('hospital_id', profile?.hospital_id)
      .eq('type', 'Radiology')
      .order('requested_at', { ascending: false });

    if (patientId) query = query.eq('patient_id', patientId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Doctor']);
  if (authError) return authError;

  try {
    const { patient_id, appointment_id, test_name, clinical_notes } = await request.json();

    const insertData = {
      hospital_id: profile?.hospital_id,
      patient_id,
      appointment_id: appointment_id || null,
      doctor_id: profile?.id,
      type: 'Radiology',
      test_name, // E.g., "MRI Brain", "Chest X-Ray"
      clinical_notes,
      status: 'Pending'
    };

    const { data, error } = await (supabaseAdmin || supabase)
      .from('clinical_requests')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    // AUTOMATED BILLING Integration
    try {
      await BillingService.generateAutoInvoice({
        hospitalId: profile?.hospital_id,
        patientId: patient_id,
        sourceType: 'Radiology',
        sourceId: data.id,
        userProfile: profile,
        services: [{
          id: 'radiology-investigation',
          name: test_name || 'Radiology Investigation',
          price: 15000, // Default radiology fee
          quantity: 1,
          total: 15000
        }]
      });
    } catch (billingError) {
      console.error('[Auto-Billing Failed] Radiology:', billingError);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Radiologist']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { request_id, status, results, file_url, dicom_url } = body;

    const updateData: any = {
      status,
      handled_by: profile?.id
    };

    if (results) updateData.results = results;
    if (file_url) updateData.file_url = file_url;
    if (dicom_url) updateData.dicom_url = dicom_url;
    
    if (status === 'Completed') updateData.completed_at = new Date().toISOString();

    const { data, error } = await (supabaseAdmin || supabase)
      .from('clinical_requests')
      .update(updateData)
      .eq('id', request_id)
      .eq('hospital_id', profile?.hospital_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
