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

    // Ensure we don't accidentally skip standalone bills by checking filters
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);
    if (status && status !== 'all') query = query.eq('payment_status', status);

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
      
      // Layered unit detection if appointment info is missing
      let derivedDepartment = 'Laboratory';
      if (apt?.unit?.name) {
        derivedDepartment = apt.unit.name;
      } else if (apt?.department) {
        derivedDepartment = apt.department;
      } else if (bill.services && Array.isArray(bill.services)) {
        if (bill.services.some((s: any) => s.name?.toLowerCase().includes('x-ray') || s.name?.toLowerCase().includes('mri') || s.name?.toLowerCase().includes('scan') || s.name?.toLowerCase().includes('ultrasound'))) {
          derivedDepartment = 'Radiology';
        } else if (bill.services.some((s: any) => s.name?.toLowerCase().includes('drug') || s.name?.toLowerCase().includes('tablet') || s.name?.toLowerCase().includes('injection') || s.name?.toLowerCase().includes('syrup'))) {
          derivedDepartment = 'Pharmacy';
        }
      }

      return {
        fullName: apt?.full_name || patient?.full_name || 'Individual Patient',
        patientId: apt?.patient_id || patient?.patient_id || bill.patient_id || 'N/A',
        appointmentId: apt?.appointment_id || 'STANDALONE',
        appointmentDate: apt?.appointment_date || bill.created_at,
        department: derivedDepartment,
        billNumber: bill.bill_number,
        totalAmount: Number(bill.total_amount || 0),
        paidAmount: Number(bill.paid_amount || 0),
        dueAmount: Number(bill.due_amount || 0),
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
