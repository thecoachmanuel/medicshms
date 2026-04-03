import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get dashboard stats overview (Admin, Receptionist, Doctor)
// GET /api/dashboard/stats
export async function GET(request: Request) {
  const { error: authError, profile: userProfile, supabase: supabaseClient } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  const client = (supabaseAdmin || supabaseClient);

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const [
      { count: totalPatients },
      { count: totalDoctors },
      { count: totalDepartments },
      { data: todayAppointmentsData },
      { data: appointmentStatsData },
      { data: revenueData },
      { count: pendingBills },
      { count: openTickets },
      { count: activeAnnouncements }
    ] = await Promise.all([
      client.from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', userProfile?.hospital_id),
      client.from('doctors').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('hospital_id', userProfile?.hospital_id),
      client.from('departments').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('hospital_id', userProfile?.hospital_id),
      // Fetch all appointments for today specifically
      client.from('public_appointments').select('appointment_date, appointment_status, visit_type, created_at').eq('hospital_id', userProfile?.hospital_id).eq('appointment_date', startOfToday.split('T')[0]),
      // Fetch recent appointments for growth calculation
      client.from('public_appointments').select('appointment_date, appointment_status, visit_type, created_at').eq('hospital_id', userProfile?.hospital_id).gte('created_at', startOfLastMonth),
      // Fetch bills from the start of last month onwards to ensure exact monthly and growth calculation
      // Increased limit to 5000 to handle hospitals with high transaction volume
      client.from('bills')
        .select('total_amount, paid_amount, created_at')
        .eq('hospital_id', userProfile?.hospital_id)
        .gte('created_at', startOfLastMonth)
        .limit(5000),
      client.from('bills').select('*', { count: 'exact', head: true }).eq('hospital_id', userProfile?.hospital_id).in('payment_status', ['Pending', 'Due', 'Partial']),
      client.from('support_tickets').select('*', { count: 'exact', head: true }).eq('hospital_id', userProfile?.hospital_id).in('status', ['Open', 'In Progress']),
      client.from('announcements').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('hospital_id', userProfile?.hospital_id)
    ]);

    // Calculate total revenue from ALL bills (fallback to a separate count or aggregate if possible, 
    // but for the dashboard stats, we'll sum what we fetched plus a base if needed)
    // To be truly exact for 'totalRevenueVal', we'd need an RPC. 
    // For now, we sum the fetched records which cover the last 60 days.

    // Process Appointment Stats in-memory
    const apts = appointmentStatsData || [];
    const todayApts = todayAppointmentsData || [];
    const todayAppointments = todayApts.filter(a => ['Pending', 'Confirmed'].includes(a.appointment_status)).length;
    const monthAppointments = apts.filter(a => a.created_at >= startOfMonth).length;
    const lastMonthAppointments = apts.filter(a => a.created_at >= startOfLastMonth && a.created_at <= endOfLastMonth).length;
    
    const pendingAppointments = apts.filter(a => a.appointment_status === 'Pending').length;
    const confirmedAppointments = apts.filter(a => a.appointment_status === 'Confirmed').length;
    const completedAppointments = apts.filter(a => a.appointment_status === 'Completed').length;
    const cancelledAppointments = apts.filter(a => a.appointment_status === 'Cancelled').length;
    
    const newPatientsThisMonth = apts.filter(a => a.visit_type === 'New Patient' && a.created_at >= startOfMonth).length;
    const newPatientsLastMonth = apts.filter(a => a.visit_type === 'New Patient' && a.created_at >= startOfLastMonth && a.created_at <= endOfLastMonth).length;

    // Process Revenue Stats in-memory
    const bills = revenueData || [];
    const totalRevenueVal = bills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const monthRevenueData = bills.filter(b => b.created_at >= startOfMonth);
    const monthRevenueVal = monthRevenueData.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const monthPaidVal = monthRevenueData.reduce((sum, b) => sum + Number(b.paid_amount || 0), 0);
    const lastMonthRevenueVal = bills.filter(b => b.created_at >= startOfLastMonth && b.created_at <= endOfLastMonth)
                                     .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    const calcChange = (current: number | null, previous: number | null) => {
      const cur = current || 0;
      const prev = previous || 0;
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 100);
    };

    return NextResponse.json({
      cards: {
        totalPatients: { value: totalPatients || 0, change: calcChange(monthAppointments, lastMonthAppointments) },
        todayAppointments: { value: todayAppointments || 0, total: totalPatients || 0 },
        totalDoctors: { value: totalDoctors || 0, departments: totalDepartments || 0 },
        monthRevenue: {
          value: monthRevenueVal,
          change: calcChange(monthRevenueVal, lastMonthRevenueVal),
          totalRevenue: totalRevenueVal,
          paid: monthPaidVal,
        },
        newPatients: { value: newPatientsThisMonth || 0, change: calcChange(newPatientsThisMonth, newPatientsLastMonth) },
        pendingBills: { value: pendingBills || 0 },
        openTickets: { value: openTickets || 0 },
        activeAnnouncements: { value: activeAnnouncements || 0 },
      },
      appointmentStatus: {
        pending: pendingAppointments || 0,
        confirmed: confirmedAppointments || 0,
        completed: completedAppointments || 0,
        cancelled: cancelledAppointments || 0,
        total: totalPatients || 0,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ message: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
