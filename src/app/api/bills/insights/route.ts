import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    let query = (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*, bills!inner(*)')
      .eq('hospital_id', profile?.hospital_id)
      .order('appointment_date', { ascending: false });

    if (dateFrom) query = query.gte('appointment_date', dateFrom);
    if (dateTo) query = query.lte('appointment_date', dateTo);
    if (department) query = query.eq('department', department);
    if (status) query = query.eq('bills.payment_status', status);

    const { data, error } = await query;
    if (error) throw error;

    const merged = (data || []).map(apt => {
      const bill = (apt as any).bills;
      return {
        fullName: apt.full_name,
        patientId: apt.patient_id,
        appointmentId: apt.appointment_id,
        appointmentDate: apt.appointment_date,
        department: apt.department,
        billNumber: bill.bill_number,
        totalAmount: bill.total_amount,
        paidAmount: bill.paid_amount || 0,
        dueAmount: bill.due_amount || 0,
        paymentStatus: bill.payment_status,
        paymentMethod: bill.payment_method || '',
      };
    });

    const analytics = {
      totalInvoices: merged.length,
      totalRevenue: merged.reduce((sum, m) => sum + m.totalAmount, 0),
      totalPaid: merged.reduce((sum, m) => sum + m.paidAmount, 0),
      totalDue: merged.reduce((sum, m) => sum + m.dueAmount, 0),
      statusBreakdown: {
        paid: merged.filter(m => m.paymentStatus === 'Paid').length,
        pending: merged.filter(m => m.paymentStatus === 'Pending').length,
        cancelled: merged.filter(m => m.paymentStatus === 'Cancelled').length,
        partial: merged.filter(m => m.paymentStatus === 'Partial').length,
      }
    };

    return NextResponse.json({
      success: true,
      data: merged,
      analytics,
      total: merged.length
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
