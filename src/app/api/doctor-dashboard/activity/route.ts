import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

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

// Get doctor activity feed (Doctor only)
// GET /api/doctor-dashboard/activity
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Doctor']);
  if (authError) return authError;

  try {
    const doctor = await getDoctorDoc(profile?.id || '', profile?.hospital_id);
    if (!doctor) return NextResponse.json({ message: 'Doctor profile not found' }, { status: 404 });

    const { data: appointments, error } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*')
      .eq('hospital_id', profile?.hospital_id)
      .eq('doctor_assigned_id', doctor.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const feed = (appointments || []).map(apt => {
      let action = 'Appointment booked';
      let type = 'appointment';
      if (apt.appointment_status === 'Completed') {
        action = 'Consultation completed';
        type = 'completed';
      } else if (apt.appointment_status === 'Confirmed') {
        action = 'Appointment confirmed';
        type = 'confirmed';
      } else if (apt.appointment_status === 'Cancelled') {
        action = 'Appointment cancelled';
        type = 'cancelled';
      }

      return {
        _id: apt.id,
        type,
        title: action,
        description: `${apt.full_name} — ${apt.department || 'General'} — ${apt.visit_type || ''}`,
        time: apt.updated_at || apt.created_at,
        status: apt.appointment_status,
      };
    });

    return NextResponse.json(feed);
  } catch (error: any) {
    console.error('Doctor activity error:', error);
    return NextResponse.json({ message: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
