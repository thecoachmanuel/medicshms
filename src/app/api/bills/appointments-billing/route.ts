import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { BillingService } from '@/lib/billing-service';

export async function GET(request: Request) {
  try {
    const { profile: userProfile, error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 1. Fetch ALL bills for this hospital with appointment info (Join with departments for name)
    const { data: allBills, error: billError } = await (supabaseAdmin || supabase)
      .from('bills')
      .select(`
        *,
        appointment:public_appointments!public_appointment_id(
          *,
          unit:departments!department_id(name)
        )
      `)
      .eq('hospital_id', userProfile?.hospital_id)
      .order('created_at', { ascending: false });

    if (billError) throw billError;

    // 2. Fetch all related patients manually since we want to handle potential ID mismatches (UUID vs custom string)
    const uniquePatientIds = [...new Set((allBills || []).map(b => b.patient_id).filter(Boolean))];
    let patientMap: Record<string, any> = {};
    
    if (uniquePatientIds.length > 0) {
      // We check both 'id' (UUID) and 'patient_id' (String) to be extremely robust
      const { data: patients, error: pError } = await (supabaseAdmin || supabase)
        .from('patients')
        .select('full_name, patient_id, id, gender, date_of_birth')
        .or(`id.in.("${uniquePatientIds.join('","')}"),patient_id.in.("${uniquePatientIds.join('","')}")`);
      
      if (!pError && patients) {
        patients.forEach(p => {
          // Map by both so lookups always succeed regardless of which ID is stored in bill.patient_id
          patientMap[p.id] = p;
          patientMap[p.patient_id] = p;
        });
      }
    }

    // 3. Fetch ALL appointments that DON'T have bills yet
    const billedAppointmentIds = (allBills || [])
      .filter(b => b.public_appointment_id)
      .map(b => b.public_appointment_id);

    let aptQuery = (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*, doctors!doctor_assigned_id(*, profiles!user_id(name))')
      .eq('hospital_id', userProfile?.hospital_id);

    if (billedAppointmentIds.length > 0) {
      aptQuery = aptQuery.not('id', 'in', `(${billedAppointmentIds.join(',')})`);
    }

    const { data: unbilledAppointments, error: aptError } = await aptQuery.order('created_at', { ascending: false });
    if (aptError) throw aptError;

    // Get IDs of lab requests that are already linked to bills to be safe
    const billedRequestIds = (allBills || []).map(b => b.clinical_request_id).filter(Boolean);

    const { data: unbilledLabRequests } = await (supabaseAdmin || supabase)
      .from('clinical_requests')
      .select('*, patient:patients!patient_id(full_name, patient_id, gender, date_of_birth)')
      .eq('hospital_id', userProfile?.hospital_id)
      .eq('type', 'Laboratory')
      .eq('payment_status', 'Pending')
      .is('bill_id', null)
      .order('requested_at', { ascending: false });

    // AUTO-HEAL: If any lab requests are found unbilled, convert them to bills immediately so they show up perfectly
    let fetchedAllBills = allBills || [];
    if (unbilledLabRequests && unbilledLabRequests.length > 0) {
      let healedCount = 0;
      for (const req of unbilledLabRequests) {
        try {
          const newBill = await BillingService.generateAutoInvoice({
            hospitalId: userProfile?.hospital_id as string,
            patientId: req.patient_id,
            sourceType: 'Laboratory',
            sourceId: req.id,
            appointmentId: undefined,
            userProfile,
            services: [{
              id: req.service_id || 'manual',
              name: req.test_name || 'Lab Test',
              price: req.test_price || 0,
              quantity: 1,
              total: req.test_price || 0
            }]
          });

          // Fallback: If price is STILL 0, try to pull from Test Catalog to fix clinical history
          if (newBill && newBill.total_amount <= 0 && req.test_name) {
             const { data: cat } = await (supabaseAdmin || supabase)
               .from('lab_test_catalog')
               .select('price, id')
               .eq('hospital_id', userProfile?.hospital_id)
               .eq('test_name', req.test_name)
               .maybeSingle();
             
             if (cat && cat.price > 0) {
                const updatedPrice = cat.price;
                const { data: updatedBill } = await (supabaseAdmin || supabase)
                   .from('bills')
                   .update({
                      subtotal: updatedPrice,
                      total_amount: updatedPrice,
                      due_amount: updatedPrice,
                      services: [{
                        id: req.service_id || 'manual',
                        name: req.test_name,
                        price: updatedPrice,
                        quantity: 1,
                        total: updatedPrice
                      }]
                   })
                   .eq('id', newBill.id)
                   .select()
                   .single();
                
                if (updatedBill) {
                   // Replace the bill in our local variable for this render
                   Object.assign(newBill, updatedBill);
                }
             }
          }
          if (newBill) {
             // Fake append it to allBills so it renders in this cycle
             fetchedAllBills.unshift({
               ...newBill,
               clinical_request_id: req.id, // Crucial for filtering unbilled entries below
               appointment: null // No appointment for pure lab
             });
             healedCount++;
          }
        } catch (e) {
          console.error("Auto-heal lab bill failed", e);
        }
      }
      
      if (healedCount > 0) {
         // Also append patients to patientMap if needed
         unbilledLabRequests.forEach(req => {
            if (req.patient) {
               patientMap[req.patient_id] = req.patient;
               patientMap[req.patient?.patient_id] = req.patient;
            }
         });
      }
    }

    // 5. Transform Bills into the View Schema (Use patientMap)
    const billEntries = fetchedAllBills.map(bill => {
      const apt = bill.appointment;
      const patient = patientMap[bill.patient_id];
      return {
        _id: bill.id,
        fullName: patient?.full_name || apt?.full_name || 'Individual Patient',
        patientId: patient?.patient_id || bill.patient_id || apt?.patient_id || 'N/A',
        appointmentId: apt?.appointment_id || 'STANDALONE',
        appointmentDate: apt?.appointment_date || bill.created_at,
        appointmentTime: apt?.appointment_time || '',
        department: (apt as any)?.unit?.name || apt?.department || 'Laboratory',
        gender: patient?.gender || apt?.gender || '',
        age: apt?.age || 0,
        doctorName: (apt?.doctors as any)?.profiles?.name || null,
        appointmentStatus: apt?.appointment_status || 'Standalone',
        bill: {
          _id: bill.id,
          billNumber: bill.bill_number,
          services: bill.services || [],
          subtotal: bill.subtotal || 0,
          discount: bill.discount || 0,
          roundOff: bill.round_off || 0,
          totalAmount: bill.total_amount || 0,
          paidAmount: bill.paid_amount || 0,
          dueAmount: bill.due_amount || 0,
          paymentStatus: bill.payment_status,
          paymentMethod: bill.payment_method,
          transactionId: bill.transaction_id,
          createdAt: bill.created_at
        }
      };
    });

    // 6. Transform Unbilled Appointments
    const unbilledAptEntries = (unbilledAppointments || []).map(apt => ({
      _id: apt.id,
      fullName: apt.full_name,
      patientId: apt.patient_id,
      appointmentId: apt.appointment_id,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      department: (apt as any)?.profiles?.department?.name || apt.department || 'General Clinic',
      gender: apt.gender,
      age: apt.age,
      doctorName: (apt.doctors as any)?.profiles?.name || null,
      appointmentStatus: apt.appointment_status,
      bill: null
    }));

    // 7. Transform Unbilled Lab Requests (These should mostly be 0 now due to auto-heal)
    const unbilledLabEntries = (unbilledLabRequests || []).filter(r => !r.bill_id && !fetchedAllBills.find(b => b.clinical_request_id === r.id || b.id === r.bill_id)).map(req => ({
      _id: req.id,
      fullName: req.patient?.full_name || 'Individual Patient',
      patientId: req.patient?.patient_id || req.patient_id,
      appointmentId: 'STANDALONE',
      appointmentDate: req.requested_at,
      appointmentTime: '',
      department: 'Laboratory',
      gender: req.patient?.gender || '',
      age: 0,
      doctorName: req.requested_by_name || 'Direct Request',
      appointmentStatus: 'Billed (Diagnostic)',
      bill: null
    }));

    // 8. Merge and Sort
    let merged = [...billEntries, ...unbilledAptEntries, ...unbilledLabEntries].sort((a, b) => 
      new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    );

    // Filtering logic remains the same
    if (status && status !== 'all') {
      if (status === 'not-generated') {
        merged = merged.filter(item => !item.bill);
      } else {
        merged = merged.filter(item =>
          item.bill && item.bill.paymentStatus.toLowerCase() === status.toLowerCase()
        );
      }
    }

    if (search) {
      const s = search.toLowerCase();
      merged = merged.filter(item =>
        item.fullName?.toLowerCase().includes(s) ||
        item.appointmentId?.toString().toLowerCase().includes(s) ||
        item.patientId?.toLowerCase().includes(s) ||
        item.bill?.billNumber?.toLowerCase().includes(s)
      );
    }

    const total = merged.length;
    const data = merged.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
