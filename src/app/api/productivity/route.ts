import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    // 1. Fetch Staff Activity Counts (Completed Actions)
    const [appointments, labRequests, radioRequests, prescriptions] = await Promise.all([
      (supabaseAdmin || supabase)
        .from('public_appointments')
        .select('appointment_status, doctor_assigned_id')
        .eq('hospital_id', hospital_id),
      (supabaseAdmin || supabase)
        .from('clinical_requests')
        .select('status, handled_by, type')
        .eq('hospital_id', hospital_id)
        .eq('type', 'Laboratory'),
      (supabaseAdmin || supabase)
        .from('clinical_requests')
        .select('status, handled_by, type')
        .eq('hospital_id', hospital_id)
        .eq('type', 'Radiology'),
      (supabaseAdmin || supabase)
        .from('prescriptions')
        .select('status, pharmacist_id')
        .eq('hospital_id', hospital_id)
    ]);

    // Aggregate by Personnel
    const stats: Record<string, any> = {};

    // Helper to increment stats
    const track = (userId: string, metric: string) => {
      if (!userId) return;
      if (!stats[userId]) stats[userId] = { 
        appointmentsCount: 0, 
        labsCount: 0, 
        radiologyCount: 0, 
        pharmacyCount: 0,
        totalActions: 0 
      };
      stats[userId][metric]++;
      stats[userId].totalActions++;
    };

    appointments.data?.forEach(a => {
      if (a.appointment_status === 'Completed') track(a.doctor_assigned_id, 'appointmentsCount');
    });
    labRequests.data?.forEach(l => {
      if (l.status === 'Completed') track(l.handled_by, 'labsCount');
    });
    radioRequests.data?.forEach(r => {
      if (r.status === 'Completed') track(r.handled_by, 'radiologyCount');
    });
    prescriptions.data?.forEach(p => {
      if (p.status === 'Dispensed') track(p.pharmacist_id, 'pharmacyCount');
    });

    // Resolve Names
    const userIds = Object.keys(stats);
    const { data: profiles } = await (supabaseAdmin || supabase)
      .from('profiles')
      .select('id, name, role')
      .in('id', userIds);

    const leaderBoard = profiles?.map(p => ({
      ...stats[p.id],
      id: p.id,
      name: p.name,
      role: p.role
    })).sort((a: any, b: any) => (b.totalActions || 0) - (a.totalActions || 0)) || [];

    // Global Hospital Stats
    const summary = {
      totalEncounters: appointments.data?.length || 0,
      completedEncounters: appointments.data?.filter(a => a.appointment_status === 'Completed').length || 0,
      pendingLabs: labRequests.data?.filter(l => l.status === 'Pending').length || 0,
      pendingImaging: radioRequests.data?.filter(r => r.status === 'Pending').length || 0,
      totalPrescriptions: prescriptions.data?.length || 0
    };

    return NextResponse.json({ 
      data: { 
        summary, 
        leaderBoard 
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
