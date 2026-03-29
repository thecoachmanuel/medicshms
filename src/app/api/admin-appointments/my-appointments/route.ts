import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get doctor's assigned appointments (Doctor only)
// GET /api/admin-appointments/my-appointments
export async function GET(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Doctor']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userProfile?.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ success: false, message: 'Doctor profile not found' }, { status: 404 });
    }

    let query = supabase
      .from('public_appointments')
      .select('id, appointment_id, full_name, mobile_number, email_address, appointment_date, appointment_time, department, appointment_status', { count: 'exact' })
      .eq('doctor_assigned_id', doctor.id)
      .eq('hospital_id', userProfile?.hospital_id);

    if (status && status !== 'All' && status !== 'all') query = query.eq('appointment_status', status);
    if (date) query = query.eq('appointment_date', date);
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,appointment_id.ilike.%${search}%,mobile_number.ilike.%${search}%`);
    }

    const { data: appointments, error, count } = await query
      .order('appointment_date', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const formatted = (appointments || []).map(apt => ({
      _id: apt.id,
      appointmentId: apt.appointment_id,
      fullName: apt.full_name,
      emailAddress: apt.email_address,
      mobileNumber: apt.mobile_number,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      department: apt.department,
      appointmentStatus: apt.appointment_status
    }));

    return NextResponse.json({ 
      data: formatted, 
      pagination: { 
        total: count || 0, 
        pages: Math.ceil((count || 0) / limit),
        currentPage: page
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
