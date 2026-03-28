import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

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

    // Fetch all appointments with doctor info for this hospital
    const { data: appointments, error: aptError } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*, doctors:doctor_assigned_id(*, profiles:user_id(name))')
      .eq('hospital_id', userProfile?.hospital_id)
      .order('created_at', { ascending: false });

    if (aptError) throw aptError;

    // Fetch all bills for this hospital
    const { data: bills, error: billError } = await (supabaseAdmin || supabase)
      .from('bills')
      .select('*')
      .eq('hospital_id', userProfile?.hospital_id);
      
    if (billError) throw billError;

    const billMap: Record<string, any> = {};
    (bills || []).forEach(bill => {
      if (bill.public_appointment_id) {
        billMap[bill.public_appointment_id] = bill;
      }
    });

    // Merge
    let merged = (appointments || []).map(apt => {
      const bill = billMap[apt.id];
      return {
        _id: apt.id,
        fullName: apt.full_name,
        patientId: apt.patient_id,
        appointmentId: apt.appointment_id,
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
        department: apt.department,
        mobileNumber: apt.mobile_number,
        emailAddress: apt.email_address,
        gender: apt.gender,
        age: apt.age,
        doctorName: (apt.doctors as any)?.profiles?.name || null,
        doctorFees: (apt.doctors as any)?.fees || 0,
        appointmentStatus: apt.appointment_status,
        visitType: apt.visit_type,
        bill: bill ? {
          _id: bill.id,
          billNumber: bill.bill_number,
          services: bill.services,
          subtotal: bill.subtotal,
          discount: bill.discount,
          roundOff: bill.round_off || 0,
          totalAmount: bill.total_amount,
          paidAmount: bill.paid_amount || 0,
          dueAmount: bill.due_amount || 0,
          paymentStatus: bill.payment_status,
          paymentMethod: bill.payment_method,
          transactionId: bill.transaction_id,
          generatedBy: bill.generated_by,
          createdAt: bill.created_at
        } : null
      };
    });

    // Filtering
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
        item.appointmentId?.toLowerCase().includes(s) ||
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
