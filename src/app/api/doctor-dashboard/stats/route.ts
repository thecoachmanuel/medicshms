import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { getLocalDateString } from '@/lib/utils';

// Helper: get Doctor document for logged-in user
const getDoctorDoc = async (userId: string, hospitalId?: string) => {
    let query = (supabaseAdmin || supabase)
        .from('doctors')
        .select('*')
        .eq('user_id', userId);
    
    if (hospitalId) {
        query = query.eq('hospital_id', hospitalId);
    }

    const { data, error } = await query.single();
    if (error) return null;
    return data;
};

// Get doctor dashboard stats (Doctor only)
// GET /api/doctor-dashboard/stats
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Doctor']);
  if (authError) return authError;

  try {
    const doctor = await getDoctorDoc(profile?.id || '', profile?.hospital_id);
    if (!doctor) return NextResponse.json({ message: 'Doctor profile not found' }, { status: 404 });

    const doctorId = doctor.id;
    const now = new Date();
    const startOfToday = getLocalDateString();
    const endOfToday = startOfToday; // For DATE column, start and end are the same
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekISO = startOfWeek.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();

    const [
      { count: todayTotal },
      { count: todayCompleted },
      { count: todayPending },
      { count: todayConfirmed },
      { count: upcomingCount },
      { count: totalCompleted },
      { count: totalCancelled },
      { count: totalAppointments },
      { count: weekConsultations },
      { count: monthConsultations },
      { count: lastMonthConsultations },
      { data: uniquePatientsData },
      { count: newPatients },
      { count: followUpPatients },
      { count: pendingCount },
      { count: confirmedCount },
      { count: completedCount },
      { count: cancelledCount },
      { data: revenueData },
      { data: monthRevenueData }
    ] = await Promise.all([
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gte('appointment_date', startOfToday).lte('appointment_date', endOfToday).in('appointment_status', ['Pending', 'Confirmed', 'Completed']),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gte('appointment_date', startOfToday).lte('appointment_date', endOfToday).eq('appointment_status', 'Completed'),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gte('appointment_date', startOfToday).lte('appointment_date', endOfToday).eq('appointment_status', 'Pending'),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gte('appointment_date', startOfToday).lte('appointment_date', endOfToday).eq('appointment_status', 'Confirmed'),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gt('appointment_date', endOfToday).in('appointment_status', ['Pending', 'Confirmed']),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('appointment_status', 'Completed'),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('appointment_status', 'Cancelled'),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gte('appointment_date', startOfWeekISO).in('appointment_status', ['Completed', 'Confirmed', 'Pending']),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gte('created_at', startOfMonth),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
      (supabaseAdmin || supabase).from('public_appointments').select('patient_id').eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('visit_type', 'New Patient'),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('visit_type', 'Follow-up'),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('appointment_status', 'Pending'),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('appointment_status', 'Confirmed'),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('appointment_status', 'Completed'),
      (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('appointment_status', 'Cancelled'),
      (supabaseAdmin || supabase).from('bills').select('total_amount, paid_amount').eq('hospital_id', profile?.hospital_id).eq('doctor_id', doctorId),
      (supabaseAdmin || supabase).from('bills').select('total_amount').eq('hospital_id', profile?.hospital_id).eq('doctor_id', doctorId).gte('created_at', startOfMonth)
    ]);

    const uniquePatientsCount = new Set((uniquePatientsData || []).map(p => p.patient_id)).size;
    const totalRevenueVal = (revenueData || []).reduce((sum, b) => sum + Number(b.total_amount), 0);
    const totalPaidVal = (revenueData || []).reduce((sum, b) => sum + Number(b.paid_amount), 0);
    const monthRevenueVal = (monthRevenueData || []).reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    const calcChange = (current: number | null, previous: number | null) => {
      const cur = current || 0;
      const prev = previous || 0;
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 100);
    };

    return NextResponse.json({
      cards: {
        todayAppointments: todayTotal || 0,
        todayCompleted: todayCompleted || 0,
        todayPending: todayPending || 0,
        todayConfirmed: todayConfirmed || 0,
        upcomingAppointments: upcomingCount || 0,
        totalCompleted: totalCompleted || 0,
        totalAppointments: totalAppointments || 0,
        totalCancelled: totalCancelled || 0,
        weekConsultations: weekConsultations || 0,
        monthConsultations: monthConsultations || 0,
        monthChange: calcChange(monthConsultations, lastMonthConsultations),
        uniquePatients: uniquePatientsCount,
        newPatients: newPatients || 0,
        followUpPatients: followUpPatients || 0,
      },
      statusDistribution: {
        pending: pendingCount || 0,
        confirmed: confirmedCount || 0,
        completed: completedCount || 0,
        cancelled: cancelledCount || 0,
        total: totalAppointments || 0,
      },
      revenue: {
        total: totalRevenueVal,
        paid: totalPaidVal,
        thisMonth: monthRevenueVal,
      },
    });
  } catch (error: any) {
    console.error('Doctor dashboard stats error:', error);
    return NextResponse.json({ message: 'Failed to fetch doctor dashboard stats' }, { status: 500 });
  }
}
