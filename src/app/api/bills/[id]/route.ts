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

    const signatureUrl = bill.generated_by_signature ? getFileUrl(bill.generated_by_signature) : '';

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
      // Pass flattened fields for ViewInvoiceModal
      fullName: bill.public_appointments.full_name,
      patientId: bill.public_appointments.patient_id,
      appointmentId: bill.public_appointments.appointment_id,
      gender: bill.public_appointments.gender,
      age: bill.public_appointments.age,
      department: bill.public_appointments.doctors?.department?.name,
      publicAppointment: {
        ...bill.public_appointments,
        appointmentId: bill.public_appointments.appointment_id,
        patientId: bill.public_appointments.patient_id,
        fullName: bill.public_appointments.full_name,
        doctorAssigned: {
          ...bill.public_appointments.doctors,
          user: bill.public_appointments.doctors?.profiles
        }
      },
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
  const { profile: userProfile, error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { services, discount, roundOff, paidAmount, paymentMethod, transactionId, notes, paymentStatus } = await request.json();

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

    // Use explicit status override if provided, otherwise auto-calculate
    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
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

    return NextResponse.json({ success: true, data: { ...updatedBill, _id: updatedBill.id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
