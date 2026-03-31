import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Lab Scientist', 'Doctor', 'Admin']);
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
        doctor:doctor_id(id),
        doctor_profile:doctor_id(*),
        handled_by_profile:handled_by(name)
      `)
      .eq('hospital_id', profile?.hospital_id)
      .eq('type', 'Laboratory')
      .order('requested_at', { ascending: false });

    if (patientId) query = query.eq('patient_id', patientId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    
    // We need to resolve doctor names carefully since doctor_profile might be pointing to auth/doctors 
    // Usually doctor_id in clinical_requests is doctors.id, let's fetch profile separately if needed.
    // For simplicity, we just return the raw data and let client handle joining if necessary.
    
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
    const { patient_id, appointment_id, doctor_id, test_name, clinical_notes } = await request.json();

    const insertData = {
      hospital_id: profile?.hospital_id,
      patient_id,
      appointment_id: appointment_id || null,
      doctor_id,
      type: 'Laboratory',
      test_name,
      clinical_notes,
      status: 'Pending'
    };

    const { data, error } = await (supabaseAdmin || supabase)
      .from('clinical_requests')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Lab Scientist']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { request_id, status, results, file_url } = body;

    const updateData: any = {
      status,
      handled_by: profile?.id
    };

    if (results) updateData.results = results;
    if (file_url) updateData.file_url = file_url;
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
