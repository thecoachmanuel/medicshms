import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get chart data (Admin, Receptionist, Doctor)
// GET /api/dashboard/charts/:type
export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor']);
  if (authError) return authError;

  const { type } = await params;
  const now = new Date();

  try {
    if (type === 'monthly-appointments') {
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
      const { data: appointments, error } = await (supabaseAdmin || supabase)
        .from('public_appointments')
        .select('created_at, appointment_status')
        .eq('hospital_id', userProfile?.hospital_id)
        .gte('created_at', twelveMonthsAgo);

      if (error) throw error;

      const chartData = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const month = d.getMonth();
        const year = d.getFullYear();
        const label = d.toLocaleString('en', { month: 'short' });

        const filtered = (appointments || []).filter(a => {
          const ad = new Date(a.created_at);
          return ad.getMonth() === month && ad.getFullYear() === year;
        });

        return {
          name: label,
          total: filtered.length,
          completed: filtered.filter(a => a.appointment_status === 'Completed').length,
          cancelled: filtered.filter(a => a.appointment_status === 'Cancelled').length
        };
      });

      return NextResponse.json(chartData);
    }

    if (type === 'monthly-revenue') {
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
      const { data: bills, error } = await (supabaseAdmin || supabase)
        .from('bills')
        .select('created_at, total_amount, paid_amount')
        .eq('hospital_id', userProfile?.hospital_id)
        .gte('created_at', twelveMonthsAgo);

      if (error) throw error;

      const chartData = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const month = d.getMonth();
        const year = d.getFullYear();
        const label = d.toLocaleString('en', { month: 'short' });

        const filtered = (bills || []).filter(b => {
          const bd = new Date(b.created_at);
          return bd.getMonth() === month && bd.getFullYear() === year;
        });

        return {
          name: label,
          revenue: filtered.reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
          collected: filtered.reduce((sum, b) => sum + Number(b.paid_amount || 0), 0)
        };
      });

      return NextResponse.json(chartData);
    }

    if (type === 'department-distribution') {
      const { data: departments } = await (supabaseAdmin || supabase).from('departments').select('name').eq('hospital_id', userProfile?.hospital_id).eq('is_active', true);
      const { data: appointments } = await (supabaseAdmin || supabase).from('public_appointments').select('department').eq('hospital_id', userProfile?.hospital_id);
      
      const chartData = (departments || []).map(dept => {
        const count = (appointments || []).filter(a => a.department === dept.name).length;
        return { name: dept.name, value: count };
      });

      chartData.sort((a, b) => b.value - a.value);
      return NextResponse.json(chartData.slice(0, 8));
    }

    if (type === 'daily-appointments') {
      const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString().split('T')[0];
      const { data: appointments } = await (supabaseAdmin || supabase)
        .from('public_appointments')
        .select('appointment_date')
        .eq('hospital_id', userProfile?.hospital_id)
        .gte('appointment_date', sevenDaysAgo);

      const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleString('en', { weekday: 'short' });

        return {
          name: label,
          value: (appointments || []).filter(a => a.appointment_date === dateStr).length
        };
      });

      return NextResponse.json(chartData);
    }

    if (type === 'appointment-sources') {
      const { data } = await (supabaseAdmin || supabase).from('public_appointments').select('source').eq('hospital_id', userProfile?.hospital_id);
      const counts = (data || []).reduce((acc: any, curr: any) => {
        const s = curr.source || 'Website';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));
      return NextResponse.json(chartData);
    }

    if (type === 'departments') {
      const [
        { data: departments },
        { data: doctors },
        { data: appointments }
      ] = await Promise.all([
        (supabaseAdmin || supabase).from('departments').select('*').eq('hospital_id', userProfile?.hospital_id).eq('is_active', true),
        (supabaseAdmin || supabase).from('doctors').select('id, department_id, additional_department_ids').eq('hospital_id', userProfile?.hospital_id).eq('is_active', true),
        (supabaseAdmin || supabase).from('public_appointments').select('department').eq('hospital_id', userProfile?.hospital_id)
      ]);

      const chartData = (departments || []).map(dept => {
        const deptDoctors = (doctors || []).filter(d => 
          d.department_id === dept.id || (d.additional_department_ids || []).includes(dept.id)
        );
        const deptAppointments = (appointments || []).filter(a => a.department === dept.name);

        return {
          _id: dept.id,
          name: dept.name,
          description: dept.description,
          image: dept.image,
          consultationFee: dept.default_consultation_fee,
          servicesCount: 0,
          doctorCount: deptDoctors.length,
          appointmentCount: deptAppointments.length,
        };
      });
      return NextResponse.json(chartData);
    }

    return NextResponse.json({ message: 'Invalid chart type' }, { status: 400 });
  } catch (error: any) {
    console.error('Chart data error:', error);
    return NextResponse.json({ message: 'Failed to fetch chart data' }, { status: 500 });
  }
}
