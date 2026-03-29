import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { profile: userProfile, error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const search = searchParams.get('search');

    let query = (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*, doctors!doctor_assigned_id(profiles!user_id(name))')
      .eq('hospital_id', userProfile?.hospital_id);

    if (status && status !== 'all' && status !== 'All') query = query.eq('appointment_status', status);
    if (date) query = query.eq('appointment_date', date);
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,appointment_id.ilike.%${search}%,mobile_number.ilike.%${search}%`);
    }

    const { data: appointments, error } = await query.order('created_at', { ascending: false });

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
      appointmentStatus: apt.appointment_status,
      age: apt.age,
      gender: apt.gender,
      primaryConcern: apt.primary_concern,
      patientId: apt.patient_id,
      doctorName: (apt.doctors as any)?.profiles?.name || 'Not Assigned'
    }));

    return NextResponse.json({ 
      success: true,
      data: formatted 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
