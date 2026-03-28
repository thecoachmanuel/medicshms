import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// GET patient profile (me)
export async function GET(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request);
  if (authError) return authError;

  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*, profiles(name, email, phone)')
      .eq('user_id', userProfile?.id)
      .single();

    if (error || !patient) return NextResponse.json({ message: 'Patient profile not found' }, { status: 404 });

    return NextResponse.json({
      ...patient,
      _id: patient.id,
      user: {
        _id: patient.user_id,
        name: patient.profiles?.name,
        email: patient.profiles?.email,
        phone: patient.profiles?.phone
      }
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT update patient profile (me)
export async function PUT(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { data: patient, error } = await supabase
      .from('patients')
      .update(body)
      .eq('user_id', userProfile?.id)
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ ...patient, _id: patient.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
