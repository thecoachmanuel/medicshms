import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile, supabase: supabaseClient } = await withAuth(request, ['Lab Scientist', 'Doctor', 'Admin']);
  if (authError || !supabaseClient) return authError;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const status = searchParams.get('status');

  try {
    let query = supabaseClient
      .from('clinical_requests')
      .select(`
        *,
        patient:patients!patient_id(
          id,
          profile:profiles!user_id(name)
        ),
        doctor:doctors!doctor_id(
          id,
          profile:profiles!user_id(name)
        ),
        handled_by_profile:profiles!handled_by(name),
        unit:lab_units!unit_id(name)
      `)
      .eq('hospital_id', profile?.hospital_id)
      .eq('type', 'Laboratory')
      .order('requested_at', { ascending: false });

    if (patientId) query = query.eq('patient_id', patientId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Lab Services API Error:', error);
      throw error;
    }
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('💥 Lab Services API Crash:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError, profile, supabase: supabaseClient } = await withAuth(request, ['Doctor', 'Lab Scientist', 'Admin']);
  if (authError || !supabaseClient) return authError;

  try {
    const { 
      patient_id, appointment_id, doctor_id, test_name, clinical_notes, 
      test_price, service_id, unit_id, specimen_type, priority, 
      patient_preparation, collection_instructions 
    } = await request.json();

    const insertData: any = {
      hospital_id: profile?.hospital_id,
      patient_id,
      appointment_id: appointment_id || null,
      doctor_id: doctor_id || null,
      type: 'Laboratory',
      test_name,
      clinical_notes,
      status: 'Pending',
      payment_status: 'Unpaid',
      unit_id: unit_id || null,
      specimen_type: specimen_type || 'Venous Blood',
      priority: priority || 'Routine',
      patient_preparation: patient_preparation || null,
      collection_instructions: collection_instructions || null
    };

    // If a scientist/staff is creating it, we can pre-assign themselves
    if (profile.role === 'Lab Scientist') {
      insertData.handled_by = profile.id;
    }

    // Add financial metadata if provided
    if (test_price) insertData.test_price = test_price;
    if (service_id) insertData.service_id = service_id;

    const { data, error } = await supabaseClient
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
  const { error: authError, profile, supabase: supabaseClient } = await withAuth(request, ['Lab Scientist', 'Receptionist', 'Admin']);
  if (authError || !supabaseClient) return authError;

  try {
    const body = await request.json();
    const { 
      request_id, status, results, file_url, collected_at, 
      min_range, max_range, is_critical, unit,
      test_price, test_name, unit_id, payment_status
    } = body;

    const updateData: any = {
      handled_by: profile?.id
    };

    if (status) updateData.status = status;
    if (results) updateData.results = results;
    if (file_url) updateData.file_url = file_url;
    if (collected_at) updateData.collected_at = collected_at;
    if (min_range !== undefined) updateData.min_range = min_range;
    if (max_range !== undefined) updateData.max_range = max_range;
    if (is_critical !== undefined) updateData.is_critical = is_critical;
    if (unit) updateData.unit = unit;
    if (test_price !== undefined) updateData.test_price = test_price;
    if (test_name) updateData.test_name = test_name;
    if (unit_id) updateData.unit_id = unit_id;
    if (payment_status) updateData.payment_status = payment_status;
    
    if (status === 'Completed') updateData.completed_at = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from('clinical_requests')
      .update(updateData)
      .eq('id', request_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
