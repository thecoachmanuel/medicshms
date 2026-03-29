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

    // Fetch all appointments for this hospital
    const { data: appointments, error: aptError } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*, doctors!doctor_assigned_id(*, profiles!user_id(name))')
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

    // Merge and format
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
        doctorName: (apt.doctors as any)?.profiles?.name || 'Not Assigned',
        doctorFees: (apt.doctors as any)?.fees || 0,
        appointmentStatus: apt.appointment_status,
        visitType: apt.visit_type,
        billNumber: bill?.bill_number || 'N/A',
        totalAmount: bill?.total_amount || 0,
        paidAmount: bill?.paid_amount || 0,
        dueAmount: bill?.due_amount || 0,
        paymentStatus: bill?.payment_status || 'Pending Generation',
        paymentMethod: bill?.payment_method || 'N/A',
        transactionId: bill?.transaction_id || 'N/A',
        createdAt: bill?.created_at || 'N/A'
      };
    });

    // Filtering
    if (status && status !== 'all') {
      if (status === 'not-generated') {
        merged = merged.filter(item => item.billNumber === 'N/A');
      } else {
        merged = merged.filter(item =>
          item.paymentStatus.toLowerCase() === status.toLowerCase()
        );
      }
    }

    if (search) {
      const s = search.toLowerCase();
      merged = merged.filter(item =>
        item.fullName?.toLowerCase().includes(s) ||
        item.appointmentId?.toLowerCase().includes(s) ||
        item.patientId?.toLowerCase().includes(s) ||
        item.billNumber?.toLowerCase().includes(s)
      );
    }

    return NextResponse.json({
      success: true,
      data: merged
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
