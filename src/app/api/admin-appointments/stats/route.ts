import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  try {
    const { data: allAppointments } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('appointment_status')
      .eq('hospital_id', profile?.hospital_id);
    
    const stats = {
      total: allAppointments?.length || 0,
      pending: allAppointments?.filter(a => a.appointment_status === 'Pending').length || 0,
      confirmed: allAppointments?.filter(a => a.appointment_status === 'Confirmed').length || 0,
      cancelled: allAppointments?.filter(a => a.appointment_status === 'Cancelled').length || 0,
      completed: allAppointments?.filter(a => a.appointment_status === 'Completed').length || 0,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
