import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { profile, error: authError } = await withAuth(request, ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Lab Scientist', 'Radiologist', 'Pharmacist']);
  
  if (authError) return authError;

  try {
    const { station } = await request.json().catch(() => ({ station: null }));

    // Update appointment to increment call timestamp and set calling status
    const { data, error } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .update({
        is_calling: true,
        called_at: new Date().toISOString(),
        calling_station: station || profile.role // Fallback to role name as station
      })
      .eq('id', id)
      .eq('hospital_id', profile.hospital_id)
      .select('id, full_name, appointment_id, department')
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      message: 'Patient called to queue',
      data 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
