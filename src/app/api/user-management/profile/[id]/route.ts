import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { getFileUrl } from '@/lib/storageService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile: adminProfile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { data: profile, error } = await (supabaseAdmin || supabase)
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('hospital_id', adminProfile?.hospital_id)
      .single();

    if (error || !profile) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const profileData: any = {
      _id: profile.id,
      ...profile,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };

    if (profile.role === 'Doctor') {
      const { data: doctor } = await (supabaseAdmin || supabase)
        .from('doctors')
        .select('*, department:department_id(name)')
        .eq('user_id', id)
        .eq('hospital_id', adminProfile?.hospital_id)
        .single();
      if (doctor) {
        profileData.doctorProfile = {
          ...doctor,
          _id: doctor.id,
          profilePhoto: doctor.profile_photo ? getFileUrl(doctor.profile_photo) : '',
          digitalSignature: doctor.digital_signature ? getFileUrl(doctor.digital_signature) : '',
          isActive: doctor.is_active
        };
      }
    } else if (profile.role === 'Receptionist') {
      const { data: receptionist } = await (supabaseAdmin || supabase)
        .from('receptionists')
        .select('*')
        .eq('user_id', id)
        .eq('hospital_id', adminProfile?.hospital_id)
        .single();
      if (receptionist) {
        profileData.receptionistProfile = {
          ...receptionist,
          _id: receptionist.id,
          profilePhoto: receptionist.profile_photo ? getFileUrl(receptionist.profile_photo) : '',
          idProofDocument: receptionist.id_proof_document ? getFileUrl(receptionist.id_proof_document) : '',
          digitalSignature: receptionist.digital_signature ? getFileUrl(receptionist.digital_signature) : '',
          isActive: receptionist.is_active
        };
      }
    } else if (profile.role === 'Admin') {
      const { data: admin } = await (supabaseAdmin || supabase)
        .from('admins')
        .select('*')
        .eq('user_id', id)
        .eq('hospital_id', adminProfile?.hospital_id)
        .single();
      if (admin) {
        profileData.adminProfile = {
          ...admin,
          _id: admin.id,
          profilePhoto: admin.profile_photo ? getFileUrl(admin.profile_photo) : '',
          digitalSignature: admin.digital_signature ? getFileUrl(admin.digital_signature) : '',
          isActive: admin.is_active
        };
      }
    }

    return NextResponse.json(profileData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
