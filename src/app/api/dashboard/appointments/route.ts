import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get recent appointments (Admin, Receptionist, Doctor)
// GET /api/dashboard/appointments
export async function GET(request: Request) {
  const { error: authError } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor']);
  if (authError) return authError;

  try {
    const { data: appointments, error } = await supabase
      .from('public_appointments')
      .select('*, doctors:doctor_assigned_id(*, profiles(name))')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const result = (appointments || []).map(apt => ({
      _id: apt.id,
      patientName: apt.full_name,
      patientId: apt.patient_id,
      appointmentId: apt.appointment_id,
      department: apt.department || 'General',
      doctorName: (apt as any).doctors?.profiles?.name || 'Unassigned',
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      status: apt.appointment_status,
      visitType: apt.visit_type,
      source: apt.source || 'Website',
      createdAt: apt.created_at,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Recent appointments error:', error);
    return NextResponse.json({ message: 'Failed to fetch recent appointments' }, { status: 500 });
  }
}
