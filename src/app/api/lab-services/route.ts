import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { BillingService } from '@/lib/billing-service';

export async function GET(request: Request) {
  const { error: authError, profile, supabase: supabaseClient } = await withAuth(request, ['Lab Scientist', 'Doctor', 'Admin', 'Receptionist']);
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
          full_name,
          patient_id,
          gender,
          date_of_birth,
          profile:profiles!user_id(name)
        ),
        doctor:doctors!doctor_id(
          id,
          profile:profiles!user_id(name)
        ),
        handled_by_profile:profiles!handled_by(
          name,
          role,
          staff_record:lab_scientists!user_id(
            dept:departments!department_id(name)
          ),
          assignments:lab_unit_assignments!scientist_id(
            unit:lab_units!unit_id(name)
          )
        ),
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
  const { error: authError, profile, supabase: supabaseClient } = await withAuth(request, ['Doctor', 'Lab Scientist', 'Admin', 'Receptionist']);
  if (authError || !supabaseClient) return authError;

  try {
    const body = await request.json();
    const { 
      patient_id, appointment_id, doctor_id, test_name, clinical_notes, 
      test_price, service_id, unit_id, specimen_type, priority, 
      patient_preparation, collection_instructions,
      tests // Array of { test_name, test_price, unit_id, service_id }
    } = body;

    // Standardize tests into an array
    const testBatch = tests && Array.isArray(tests) ? tests : [{
      test_name,
      test_price,
      service_id,
      unit_id,
      clinical_notes,
      specimen_type,
      priority,
      patient_preparation,
      collection_instructions
    }].filter(t => t.test_name);

    if (testBatch.length === 0) {
      return NextResponse.json({ message: 'No tests provided' }, { status: 400 });
    }

    const createdRequests = [];
    const billingServices: any[] = [];

    for (const test of testBatch) {
      let final_price = test.test_price ? Number(test.test_price) : 0;
      let final_service_id: string | null = (test.service_id && test.service_id !== 'manual') ? test.service_id : null;

      // 1. SYNC WITH MASTER SERVICES (Billing Catalog)
      // This ensures we have a valid entry for clinical_requests.service_id FK check
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
                category: 'Laboratory',
                is_active: true
              }])
              .select()
              .single();
            if (newService) final_service_id = newService.id;
          } catch (svcError) {
            console.error('[Services Auto-Index Failed]:', svcError);
          }
        }
      }

      // 2. PARALLEL SYNC: Lab Specialized Catalog (Technical/Scientific Specs)
      if (test.test_name && final_price > 0) {
        try {
          await supabaseClient
            .from('lab_test_catalog')
            .upsert([{
              hospital_id: profile?.hospital_id,
              test_name: test.test_name,
              price: final_price,
              unit_id: test.unit_id || null,
              is_auto_created: true
            }], { onConflict: 'hospital_id,test_name' });
        } catch (catError) {
          console.error('[Lab Catalog Sync Skip]:', catError);
        }
      }

      const insertData: any = {
        hospital_id: profile?.hospital_id,
        patient_id,
        appointment_id: appointment_id || null,
        doctor_id: doctor_id || null,
        type: 'Laboratory',
        test_name: test.test_name,
        clinical_notes: test.clinical_notes || clinical_notes,
        status: 'Pending',
        payment_status: 'Pending',
        unit_id: test.unit_id || unit_id || null,
        specimen_type: test.specimen_type || specimen_type || 'Venous Blood',
        priority: test.priority || priority || 'Routine',
        patient_preparation: test.patient_preparation || patient_preparation || null,
        collection_instructions: test.collection_instructions || collection_instructions || null,
        lab_number: test.lab_number || `${(test.test_name || 'LAB').substring(0, 3).toUpperCase()}${Math.floor(100000 + Math.random() * 900000)}`,
        test_price: final_price,
        service_id: final_service_id || null // MUST BE VALID UUID OR NULL
      };

      if (profile.role === 'Lab Scientist') {
        insertData.handled_by = profile.id;
      }

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
        source_id: data.id // Internal ref for linkage after bill is created
      });
    }

    // 3. ATOMIC CONSOLIDATED BILLING
    if (billingServices.length > 0) {
      try {
        const finalBill = await BillingService.generateAutoInvoice({
          hospitalId: profile?.hospital_id,
          patientId: patient_id,
          sourceType: 'Laboratory',
          sourceId: createdRequests[0].id, // Primary tag
          appointmentId: appointment_id,
          userProfile: profile,
          services: billingServices
        });

        if (finalBill) {
          // Stamp ALL clinical requests with the bill_id for perfect linkage
          await supabaseClient
            .from('clinical_requests')
            .update({ bill_id: finalBill.id, payment_status: 'Billed' })
            .in('id', createdRequests.map(r => r.id));
        }
      } catch (billingError) {
        console.error('[Batch Auto-Billing Failed]:', billingError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      requests: createdRequests,
      message: `${createdRequests.length} tests initialized and invoiced successfully`
    }, { status: 201 });
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

    // 1. Capture Scientist's Department (Unit) for reporting accuracy
    const isScientist = profile?.role === 'Lab Scientist' || profile?.role === 'Clinical Scientist';
    if (isScientist) {
      const { data: assignment } = await supabaseClient
        .from('lab_unit_assignments')
        .select('unit_id')
        .eq('scientist_id', profile.id)
        .limit(1)
        .maybeSingle();
      
      if (assignment) {
        updateData.unit_id = assignment.unit_id;
      }
    }

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

    // 2. Proactive Auto-Billing on Completion
    if (status === 'Completed' && !data.bill_id) {
      try {
        const finalBill = await BillingService.generateAutoInvoice({
          hospitalId: profile?.hospital_id as string,
          patientId: data.patient_id,
          sourceType: 'Laboratory',
          sourceId: data.id,
          appointmentId: data.appointment_id || undefined,
          userProfile: profile,
          services: [{
            id: data.service_id || 'manual',
            name: data.test_name || 'Lab Test',
            price: Number(data.test_price || 0),
            quantity: 1,
            total: Number(data.test_price || 0)
          }]
        });
        
        if (finalBill) {
          data.bill_id = finalBill.id;
        }
      } catch (billingError) {
        console.error('[Diagnostic Auto-Billing Failed]:', billingError);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
