import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

const getDoctorDoc = async (userId: string) => {
    const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (error) return null;
    return data;
};

// Get doctor's recent appointments (Doctor only)
// GET /api/doctor-dashboard/appointments
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Doctor']);
  if (authError) return authError;

  try {
    const doctor = await getDoctorDoc(profile?.id || '');
    if (!doctor) return NextResponse.json({ message: 'Doctor profile not found' }, { status: 404 });

    const { data: appointments, error } = await supabase
      .from('public_appointments')
      .select('*')
      .eq('doctor_assigned_id', doctor.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(15);

    if (error) throw error;

    const result = (appointments || []).map(apt => ({
      _id: apt.id,
      patientName: apt.full_name,
      patientId: apt.patient_id,
      appointmentId: apt.appointment_id,
      gender: apt.gender,
      age: apt.age,
      department: apt.department || 'General',
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      status: apt.appointment_status,
      visitType: apt.visit_type,
      reasonForVisit: apt.reason_for_visit || apt.primary_concern || '',
      source: apt.source || 'Website',
      createdAt: apt.created_at,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Doctor recent appointments error:', error);
    return NextResponse.json({ message: 'Failed to fetch appointments' }, { status: 500 });
  }
}
