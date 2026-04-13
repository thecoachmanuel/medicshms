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
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    const isRestricted = userProfile?.role !== 'Admin' && (userProfile as any).department_id;
    const deptId = (userProfile as any).department_id;

    // Build base queries
    const todayQuery = client.from('public_appointments')
      .select('appointment_status, created_at, appointment_id, department_id')
      .eq('hospital_id', userProfile?.hospital_id)
      .gte('created_at', startOfToday)
      .lte('created_at', endOfToday);

    const monthQuery = client.from('public_appointments')
      .select('appointment_status, created_at, visit_type, department_id')
      .eq('hospital_id', userProfile?.hospital_id)
      .gte('created_at', startOfLastMonth);

    // Apply restriction if needed
    if (isRestricted) {
      todayQuery.eq('department_id', deptId);
      monthQuery.eq('department_id', deptId);
    }

    const results = await Promise.all([
      client.from('patients').select('*', { count: 'exact', head: true }).eq('hospital_id', userProfile?.hospital_id),
      client.from('doctors').select('*', { count: 'exact', head: true }).eq('hospital_id', userProfile?.hospital_id).eq('is_active', true),
      client.from('departments').select('*', { count: 'exact', head: true }).eq('hospital_id', userProfile?.hospital_id).eq('is_active', true),
      todayQuery,
      monthQuery,
      client.from('bills')
        .select(`
          total_amount, 
          paid_amount, 
          created_at,
          appointment:public_appointments!public_appointment_id(department, department_id)
        `)
        .eq('hospital_id', userProfile?.hospital_id)
        .gte('created_at', startOfSixMonthsAgo)
        .limit(10000),
      client.from('bills').select('*', { count: 'exact', head: true }).eq('hospital_id', userProfile?.hospital_id).in('payment_status', ['Pending', 'Due', 'Partial']),
      client.from('support_tickets').select('*', { count: 'exact', head: true }).eq('hospital_id', userProfile?.hospital_id).in('status', ['Open', 'In Progress']),
      client.from('announcements').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('hospital_id', userProfile?.hospital_id)
    ]);

    const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = results;
    const { count: totalPatients } = r1;
    const { count: totalDoctors } = r2;
    const { count: totalDepartments } = r3;
    const { data: todayAppointmentsData } = r4;
    const { data: appointmentStatsData } = r5;
    const { data: revenueData } = r6;
    const { count: pendingBills } = r7;
    const { count: openTickets } = r8;
    const { count: activeAnnouncements } = r9;

    const errors = results.filter(r => r.error).map(r => r.error);
    if (errors.length > 0) {
      console.error('One or more dashboard queries failed:', errors);
    }

    // Process Appointment Stats
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

    // Process Financial Intelligence
    const bills = revenueData || [];
    const totalRevenueVal = bills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    
    // Monthly Aggregates
    const monthRevenueData = bills.filter(b => b.created_at >= startOfMonth);
    const monthRevenueVal = monthRevenueData.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const monthPaidVal = monthRevenueData.reduce((sum, b) => sum + Number(b.paid_amount || 0), 0);
    
    const lastMonthRevenueVal = bills.filter(b => b.created_at >= startOfLastMonth && b.created_at <= endOfLastMonth)
                                     .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    // Velocity Projection
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate() || 1;
    const projectedRevenue = Math.round((monthRevenueVal / dayOfMonth) * daysInMonth);

    // Trending Logic (6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueTrend: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = d.toISOString();
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const monthBills = bills.filter(b => b.created_at >= mStart && b.created_at <= mEnd);
      revenueTrend.push({
        month: monthNames[d.getMonth()],
        revenue: monthBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
        paid: monthBills.reduce((sum, b) => sum + Number(b.paid_amount || 0), 0),
      });
    }

    const isRestricted = userProfile?.role !== 'Admin' && (userProfile as any).department_id;
    const userDeptId = (userProfile as any).department_id;

    const filteredBills = isRestricted 
      ? bills.filter(b => b.appointment?.department_id === userDeptId)
      : bills;

    filteredBills.forEach((b: any) => {
      if (b.created_at >= startOfMonth) {
        const dept = b.appointment?.department || 'General';
        revenueByDept[dept] = (revenueByDept[dept] || 0) + Number(b.total_amount || 0);
      }
    });

    // Update summarized values using filtered data
    const monthRevenueVal = filteredBills.filter(b => b.created_at >= startOfMonth).reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const monthPaidVal = filteredBills.filter(b => b.created_at >= startOfMonth).reduce((sum, b) => sum + Number(b.paid_amount || 0), 0);
    const lastMonthRevenueVal = filteredBills.filter(b => b.created_at >= startOfLastMonth && b.created_at <= endOfLastMonth)
                                            .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const totalRevenueVal = filteredBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    const calcChange = (current: number | null, previous: number | null) => {
      const cur = current || 0;
      const prev = previous || 0;
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 100);
    };

    const departmentRevenue = Object.entries(revenueByDept)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      cards: {
        totalPatients: { value: totalPatients || 0, change: calcChange(monthAppointments, lastMonthAppointments) },
        todayAppointments: { value: todayAppointments || 0, total: totalPatients || 0 },
        totalDoctors: { value: totalDoctors || 0, departments: totalDepartments || 0 },
        monthRevenue: {
          value: monthRevenueVal,
          change: calcChange(monthRevenueVal, lastMonthRevenueVal),
          totalRevenue: totalRevenueVal,
          projected: projectedRevenue,
          paid: monthPaidVal,
          collectionRate: monthRevenueVal > 0 ? Math.round((monthPaidVal / monthRevenueVal) * 100) : 0
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
      departmentRevenue,
      revenueTrend
    });
  } catch (error: any) {
    console.error('Detailed Dashboard stats error:', error);
    return NextResponse.json({ message: 'Failed to fetch dashboard stats', error: error.message }, { status: 500 });
  }
}
