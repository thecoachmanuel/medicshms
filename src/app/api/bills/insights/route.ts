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
      .from('bills')
      .select('*, appointment:public_appointments!public_appointment_id(*)')
      .eq('hospital_id', profile?.hospital_id)
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);
    if (status) query = query.eq('payment_status', status);

    const { data: bills, error } = await query;
    if (error) throw error;

    // Fetch related patients for standalone bills (those without appointments)
    const patientIds = (bills || []).filter(b => !b.appointment).map(b => b.patient_id).filter(Boolean);
    let patientMap: Record<string, any> = {};
    if (patientIds.length > 0) {
      const { data: patients } = await (supabaseAdmin || supabase)
        .from('patients')
        .select('id, patient_id, full_name')
        .or(`id.in.("${patientIds.join('","')}"),patient_id.in.("${patientIds.join('","')}")`);
      
      if (patients) {
        patients.forEach(p => {
          patientMap[p.id] = p;
          patientMap[p.patient_id] = p;
        });
      }
    }

    const merged = (bills || []).map(bill => {
      const apt = bill.appointment;
      const patient = patientMap[bill.patient_id];
      return {
        fullName: apt?.full_name || patient?.full_name || 'Individual Patient',
        patientId: apt?.patient_id || patient?.patient_id || bill.patient_id || 'N/A',
        appointmentId: apt?.appointment_id || 'STANDALONE',
        appointmentDate: apt?.appointment_date || bill.created_at,
        department: apt?.department || 'Laboratory',
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
      totalRevenue: merged.reduce((sum, m) => sum + (m.totalAmount || 0), 0),
      totalPaid: merged.reduce((sum, m) => sum + (m.paidAmount || 0), 0),
      totalDue: merged.reduce((sum, m) => sum + (m.dueAmount || 0), 0),
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
