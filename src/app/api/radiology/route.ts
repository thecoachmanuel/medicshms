import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { BillingService } from '@/lib/billing-service';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Radiologist', 'Doctor', 'Admin', 'Nurse', 'Receptionist', 'Lab Scientist', 'Pharmacist', 'Patient']);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const status = searchParams.get('status');
  const doctorId = searchParams.get('doctorId');

  try {
    let query = (supabaseAdmin || supabase)
      .from('clinical_requests')
      .select(`
        *,
        patient:patients!patient_id(
          id,
          full_name,
          patient_id,
          gender,
          date_of_birth
        ),
        doctor:doctors!doctor_id(
          id,
          profile:profiles!user_id(name)
        ),
        handled_by_profile:profiles!handled_by(name)
      `)
      .eq('hospital_id', profile?.hospital_id)
      .eq('type', 'Radiology')
      .order('requested_at', { ascending: false });

    if (patientId) {
      if (profile.role === 'Patient') {
        const { data: pRecord } = await (supabaseAdmin || supabase).from('patients').select('id').eq('user_id', profile.id).maybeSingle();
        if (!pRecord || pRecord.id !== patientId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
      query = query.eq('patient_id', patientId);
    } else if (profile.role === 'Patient') {
      const { data: pRecord } = await (supabaseAdmin || supabase).from('patients').select('id').eq('user_id', profile.id).maybeSingle();
      query = query.eq('patient_id', pRecord?.id);
    }
    if (status) query = query.eq('status', status);
    if (doctorId) query = query.eq('doctor_id', doctorId);

    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError, profile, supabase: supabaseClient } = await withAuth(request, ['Doctor', 'Radiologist', 'Admin', 'Receptionist']);
  if (authError || !supabaseClient) return authError;

  try {
    const body = await request.json();
    const { 
      patient_id, appointment_id, doctor_id, test_name, clinical_notes, 
      test_price, service_id, priority, requested_by_name,
      tests // Array of { test_name, test_price, service_id }
    } = body;

    // Standardize tests into an array
    const testBatch = tests && Array.isArray(tests) ? tests : [{
      test_name,
      test_price,
      service_id,
      clinical_notes,
      priority,
      requested_by_name
    }].filter(t => t.test_name);

    if (testBatch.length === 0) {
      return NextResponse.json({ message: 'No investigations provided' }, { status: 400 });
    }

    const createdRequests = [];
    const billingServices: any[] = [];

    for (const test of testBatch) {
      let final_price = test.test_price ? Number(test.test_price) : 0;
      let final_service_id: string | null = (test.service_id && test.service_id !== 'manual') ? test.service_id : null;

      // 1. SYNC WITH MASTER SERVICES (Billing Catalog)
      if (test.test_name) {
        const { data: existingService } = await supabaseClient
          .from('services')
          .select('id, price')
          .eq('hospital_id', profile?.hospital_id)
          .eq('name', test.test_name)
          .maybeSingle();

        if (existingService) {
          final_service_id = existingService.id;
          if (!final_price) final_price = Number(existingService.price || 0);
        } else if (final_price > 0) {
          // Auto-index into master services if it doesn't exist
          try {
            const { data: newService } = await supabaseClient
              .from('services')
              .insert([{
                hospital_id: profile?.hospital_id,
                name: test.test_name,
                price: final_price,
                category: 'Radiology',
                is_active: true
              }])
              .select()
              .single();
            if (newService) final_service_id = newService.id;
          } catch (svcError) {
            console.error('[Radiology Services Auto-Index Failed]:', svcError);
          }
        }
      }

      const insertData: any = {
        hospital_id: profile?.hospital_id,
        patient_id,
        appointment_id: appointment_id || null,
        doctor_id: doctor_id || profile?.id,
        type: 'Radiology',
        test_name: test.test_name,
        clinical_notes: test.clinical_notes || clinical_notes,
        status: 'Pending',
        payment_status: 'Pending',
        priority: test.priority || priority || 'Routine',
        test_price: final_price,
        service_id: final_service_id // Link even if manual, for bill tracking
      };

      const { data, error } = await supabaseClient
        .from('clinical_requests')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      createdRequests.push(data);
      
      billingServices.push({
        id: final_service_id || 'manual',
        name: test.test_name,
        price: final_price,
        quantity: 1,
        total: final_price,
        source_id: data.id
      });
    }

    // 2. ATOMIC CONSOLIDATED BILLING
    if (billingServices.length > 0) {
      try {
        const finalBill = await BillingService.generateAutoInvoice({
          hospitalId: profile?.hospital_id as string,
          patientId: patient_id,
          sourceType: 'Radiology',
          sourceId: createdRequests[0].id,
          appointmentId: appointment_id,
          userProfile: profile,
          services: billingServices
        });

        if (finalBill) {
          await supabaseClient
            .from('clinical_requests')
            .update({ bill_id: finalBill.id, payment_status: 'Billed' })
            .in('id', createdRequests.map(r => r.id));
          
          createdRequests.forEach(r => {
            r.bill_id = finalBill.id;
            r.payment_status = 'Billed';
          });
        }
      } catch (billingError) {
        console.error('[Radiology Auto-Billing Failed]:', billingError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      requests: createdRequests,
      message: `${createdRequests.length} investigations initialized and invoiced successfully`
    }, { status: 201 });
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
