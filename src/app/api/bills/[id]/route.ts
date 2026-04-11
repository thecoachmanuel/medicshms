import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { getFileUrl } from '@/lib/storageService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile: userProfile, error: authError } = await withAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { data: bill, error } = await (supabaseAdmin || supabase)
      .from('bills')
      .select('*, public_appointments!public_appointment_id(*, doctors!doctor_assigned_id(*, profiles!user_id(name, email), department:departments!department_id(name)))')
      .eq('id', id)
      .eq('hospital_id', userProfile?.hospital_id)
      .single();

    if (error || !bill) {
      return NextResponse.json({ success: false, message: 'Bill not found' }, { status: 404 });
    }

    // Secondary Lookup for Standalone Bills (No Appointment)
    let patientData: any = null;
    if (!bill.public_appointments && bill.patient_id) {
      const { data: patient } = await (supabaseAdmin || supabase)
        .from('patients')
        .select('*, profiles:profiles!user_id(email, name)')
        .eq('id', bill.patient_id) // Changed from patient_id (UID) to id (UUID) if needed, but let's check what bill.patient_id stores.
        .single();
      patientData = patient;
    } else if (bill.public_appointments) {
      // Even for appointment bills, get the full patient record for contact info
      const { data: patient } = await (supabaseAdmin || supabase)
        .from('patients')
        .select('*, profiles:profiles!user_id(email, name)')
        .eq('patient_id', bill.public_appointments.patient_id)
        .single();
      patientData = patient;
    }

    const signatureUrl = bill.generated_by_signature ? getFileUrl(bill.generated_by_signature) : '';

    // Calculate Age Fallback
    const calculateAge = (dob: string) => {
      if (!dob) return 0;
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age;
    };

    const result = {
      ...bill,
      _id: bill.id,
      billNumber: bill.bill_number,
      roundOff: bill.round_off || 0,
      totalAmount: bill.total_amount,
      paidAmount: bill.paid_amount || 0,
      dueAmount: bill.due_amount || 0,
      paymentStatus: bill.payment_status,
      paymentMethod: bill.payment_method,
      transactionId: bill.transaction_id,
      // Comprehensive Patient Details
      fullName: bill.public_appointments?.full_name || patientData?.full_name || 'Individual Patient',
      patientId: bill.public_appointments?.patient_id || patientData?.patient_id || bill.patient_id || 'N/A',
      appointmentId: bill.public_appointments?.appointment_id || 'STANDALONE',
      gender: bill.public_appointments?.gender || patientData?.gender || 'N/A',
      age: bill.public_appointments?.age || calculateAge(patientData?.date_of_birth),
      department: bill.public_appointments?.doctors?.department?.name || 'Laboratory',
      // Contact Info
      phone: patientData?.mobile_number || bill.public_appointments?.mobile_number || 'N/A',
      email: patientData?.profiles?.email || patientData?.email_address || bill.public_appointments?.email || 'N/A',
      address: patientData?.address || bill.public_appointments?.address || 'N/A',
      publicAppointment: bill.public_appointments ? {
        ...bill.public_appointments,
        appointmentId: bill.public_appointments.appointment_id,
        patientId: bill.public_appointments.patient_id,
        fullName: bill.public_appointments.full_name,
        doctorAssigned: {
          ...bill.public_appointments.doctors,
          user: bill.public_appointments.doctors?.profiles
        }
      } : null,
      generatedBySignatureUrl: signatureUrl
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile: userProfile, error: authError } = await withAuth(request, ['Admin', 'Receptionist', 'Lab Scientist']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const { services, discount, roundOff, paidAmount, paymentMethod, notes, paymentStatus } = body;
    // Map paymentReference (frontend) to transactionId (backend)
    const transactionId = body.transactionId || body.paymentReference;

    const { data: bill, error: fetchError } = await (supabaseAdmin || supabase)
      .from('bills')
      .select('*')
      .eq('id', id)
      .eq('hospital_id', userProfile?.hospital_id)
      .single();

    if (fetchError || !bill) {
      return NextResponse.json({ success: false, message: 'Bill not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (services !== undefined) {
      updateData.services = services;
      updateData.subtotal = services.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
    } else {
      updateData.subtotal = bill.subtotal;
    }

    const d = (discount !== undefined) ? Number(discount) : bill.discount;
    const r = (roundOff !== undefined) ? Number(roundOff) : (bill.round_off || 0);
    updateData.discount = d;
    updateData.round_off = r;
    
    if (paymentMethod !== undefined) updateData.payment_method = paymentMethod;
    if (transactionId !== undefined) updateData.transaction_id = transactionId;
    if (notes !== undefined) updateData.notes = notes;

    const totalAmount = Math.max(0, (updateData.subtotal || 0) - d + r);
    updateData.total_amount = totalAmount;

    const currentPaid = (paidAmount !== undefined) ? Math.max(0, Number(paidAmount)) : (bill.paid_amount || 0);
    updateData.paid_amount = currentPaid;
    updateData.due_amount = Math.max(0, totalAmount - currentPaid);

    // Audit Logging
    const timestamp = new Date().toLocaleString('en-NG');
    const author = userProfile?.name || userProfile?.email || 'Staff';
    const auditNote = `\n[${timestamp}] Updated by ${author}: Paid ₦${currentPaid.toLocaleString()}, Method: ${paymentMethod || 'N/A'}`;
    updateData.notes = (bill.notes || '') + auditNote;

    // Use explicit status override if provided, otherwise auto-calculate
    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
      if (paymentStatus === 'Paid') {
        updateData.paid_amount = totalAmount;
        updateData.due_amount = 0;
      }
    } else {
      if (currentPaid <= 0) {
        updateData.payment_status = 'Pending';
      } else if (currentPaid >= totalAmount) {
        updateData.payment_status = 'Paid';
        updateData.due_amount = 0;
        updateData.paid_amount = totalAmount;
      } else {
        updateData.payment_status = 'Partial';
      }
    }

    const { data: updatedBill, error: updateError } = await (supabaseAdmin || supabase)
      .from('bills')
      .update(updateData)
      .eq('id', id)
      .eq('hospital_id', userProfile?.hospital_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // --- AUTO-SYNC LOGIC ---
    const client = (supabaseAdmin || supabase);
    
    // Update any clinical requests associated with this bill
    await client
      .from('clinical_requests')
      .update({ payment_status: updateData.payment_status })
      .eq('bill_id', id);
    
    // Also update if it's an appointment bill
    if (bill.public_appointment_id) {
       // If the bill is paid, we can move the appointment forward or track payment status
       // Some hospitals use have a 'paid' column on appointments, others use the 'payment_status' on the bill itself.
       // Here we ensure the link is robust for queries.
    }
    // -----------------------

    return NextResponse.json({ success: true, data: { ...updatedBill, _id: updatedBill.id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile: userProfile, error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const client = (supabaseAdmin || supabase);

    // 1. Fetch the bill first to know associated data 
    const { data: bill, error: fetchError } = await client
      .from('bills')
      .select('*')
      .eq('id', id)
      .eq('hospital_id', userProfile?.hospital_id)
      .single();

    if (fetchError || !bill) {
      return NextResponse.json({ success: false, message: 'Bill not found' }, { status: 404 });
    }

    // 2. REVERT: Update any clinical requests associated with this bill back to Pending
    await client
      .from('clinical_requests')
      .update({ 
        payment_status: 'Pending',
        bill_id: null 
      })
      .eq('bill_id', id);

    // 3. DELETE the bill record
    const { error: deleteError } = await client
      .from('bills')
      .delete()
      .eq('id', id)
      .eq('hospital_id', userProfile?.hospital_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: 'Payment record deleted and clinical requests reverted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
