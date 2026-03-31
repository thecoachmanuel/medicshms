import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// GET patient vitals
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Doctor', 'Nurse', 'Admin']);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const appointmentId = searchParams.get('appointmentId');

  try {
    let query = (supabaseAdmin || supabase)
      .from('patient_vitals')
      .select('*, recorded_by_profile:recorded_by(name, role)')
      .eq('hospital_id', profile?.hospital_id)
      .order('recorded_at', { ascending: false });

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST new vitals
export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Doctor', 'Nurse']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { 
      patient_id, 
      appointment_id, 
      blood_pressure, 
      heart_rate, 
      temperature, 
      respiratory_rate, 
      oxygen_saturation, 
      weight, 
      height, 
      bmi, 
      notes, 
      recorded_at 
    } = body;

    if (!patient_id) {
      return NextResponse.json({ message: 'patient_id is required' }, { status: 400 });
    }

    const newVitals = {
      hospital_id: profile?.hospital_id,
      patient_id,
      appointment_id: appointment_id || null,
      recorded_by: profile?.id,
      blood_pressure,
      heart_rate,
      temperature,
      respiratory_rate,
      oxygen_saturation,
      weight,
      height,
      bmi,
      notes,
      recorded_at: recorded_at || new Date().toISOString()
    };

    const { data, error } = await (supabaseAdmin || supabase)
      .from('patient_vitals')
      .insert([newVitals])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to record vitals' }, { status: 500 });
  }
}
