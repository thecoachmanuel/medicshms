import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { getFileUrl } from '@/lib/storageService';

// GET doctor by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: doctor, error } = await (supabaseAdmin || supabase)
      .from('doctors')
      .select('*, profiles(name, email, phone), department:department_id(name)')
      .eq('id', id)
      .single();

    if (error || !doctor) return NextResponse.json({ message: 'Doctor not found' }, { status: 404 });

    const profilePhotoUrl = doctor.profile_photo ? getFileUrl(doctor.profile_photo) : '';
    const digitalSignatureUrl = doctor.digital_signature ? getFileUrl(doctor.digital_signature) : '';

    return NextResponse.json({
      ...doctor,
      _id: doctor.id,
      profilePhotoUrl,
      digitalSignatureUrl,
      user: {
        _id: doctor.user_id,
        name: doctor.profiles.name,
        email: doctor.profiles.email,
        phone: doctor.profiles.phone
      }
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT update doctor profile
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: authError, profile } = await withAuth(request);
  if (authError) return authError;

  try {
    // Check if the user is an Admin or the Doctor himself, and verify hospital_id
    const { data: doctorRecord } = await (supabaseAdmin || supabase)
      .from('doctors')
      .select('user_id, hospital_id')
      .eq('id', id)
      .single();
    
    if (!doctorRecord) return NextResponse.json({ message: 'Doctor not found' }, { status: 404 });

    if (doctorRecord.hospital_id !== profile?.hospital_id) {
       return NextResponse.json({ message: 'Forbidden: Cross-tenant access' }, { status: 403 });
    }

    if (profile?.role !== 'Admin' && profile?.id !== doctorRecord.user_id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { data: updatedDoctor, error } = await (supabaseAdmin || supabase)
      .from('doctors')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ ...updatedDoctor, _id: updatedDoctor.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
