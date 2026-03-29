import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { getLocalDateString } from '@/lib/utils';

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

// Get doctor charts data (Doctor only)
// GET /api/doctor-dashboard/charts/:type
export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { error: authError, profile } = await withAuth(request, ['Doctor']);
  if (authError) return authError;

  const { type } = await params;

  try {
    const doctor = await getDoctorDoc(profile?.id || '', profile?.hospital_id);
    if (!doctor) return NextResponse.json({ message: 'Doctor profile not found' }, { status: 404 });

    const doctorId = doctor.id;
    const now = new Date();

    if (type === 'weekly') {
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateISO = getLocalDateString(d);
        const label = d.toLocaleDateString('en', { weekday: 'short' });
        const dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        const [
          { count: total },
          { count: completed },
          { count: cancelled }
        ] = await Promise.all([
          (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('appointment_date', dateISO).neq('appointment_status', 'Cancelled'),
          (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('appointment_date', dateISO).eq('appointment_status', 'Completed'),
          (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('appointment_date', dateISO).eq('appointment_status', 'Cancelled')
        ]);

        chartData.push({ label, date: dateLabel, total: total || 0, completed: completed || 0, cancelled: cancelled || 0 });
      }
      return NextResponse.json(chartData);
    }

    if (type === 'monthly-trend') {
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
        const label = d.toLocaleString('en', { month: 'short' });

        const [
          { count: total },
          { count: completed },
          { count: cancelled }
        ] = await Promise.all([
          (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gte('appointment_date', start).lte('appointment_date', end),
          (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gte('appointment_date', start).lte('appointment_date', end).eq('appointment_status', 'Completed'),
          (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).gte('appointment_date', start).lte('appointment_date', end).eq('appointment_status', 'Cancelled')
        ]);

        chartData.push({ label, total: total || 0, completed: completed || 0, cancelled: cancelled || 0 });
      }
      return NextResponse.json(chartData);
    }

    if (type === 'visit-types') {
      const [{ count: newPatient }, { count: followUp }] = await Promise.all([
        (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('visit_type', 'New Patient'),
        (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('visit_type', 'Follow-up')
      ]);
      return NextResponse.json([
        { name: 'New Patient', value: newPatient || 0 },
        { name: 'Follow-up', value: followUp || 0 },
      ]);
    }

    if (type === 'status-distribution') {
      const statuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
      const chartData = await Promise.all(statuses.map(async (s) => {
        const { count } = await (supabaseAdmin || supabase).from('public_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('doctor_assigned_id', doctorId).eq('appointment_status', s);
        return { name: s, value: count || 0 };
      }));
      return NextResponse.json(chartData);
    }

    return NextResponse.json({ message: 'Invalid chart type' }, { status: 400 });
  } catch (error: any) {
    console.error('Doctor chart data error:', error);
    return NextResponse.json({ message: 'Failed to fetch chart data' }, { status: 500 });
  }
}
