import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { buildProfileResponse } from '@/lib/profile';

// GET /api/profile/me - Get current user's profile
export async function GET(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request);
  if (authError) return authError;

  try {
    const profileData = await buildProfileResponse(userProfile?.id);
    if (!profileData) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(profileData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT /api/profile/me - Update current user's profile
export async function PUT(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request);
  if (authError) return authError;

  const userId = userProfile?.id;

  try {
    const body = await request.json();
    const { name, email, phone, qualifications, experience, fees, gender, dateOfBirth, medicalCouncilId } = body;

    // 1. Update base profile in profiles table
    const profileUpdate: any = {};
    if (name) profileUpdate.name = name;
    if (email) profileUpdate.email = email;
    if (phone) profileUpdate.phone = phone;
    profileUpdate.updated_at = new Date().toISOString();

    if (Object.keys(profileUpdate).length > 0) {
      const { error: upError } = await (supabaseAdmin || supabase)
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);
      
      if (upError) return NextResponse.json({ message: upError.message }, { status: 400 });
    }

    // 2. Update role-specific profile fields
    if (userProfile?.role === 'Doctor') {
      const docUpdate: any = {};
      if (qualifications !== undefined) docUpdate.qualifications = qualifications;
      if (experience !== undefined) docUpdate.experience = experience;
      if (fees !== undefined) docUpdate.fees = fees;
      if (gender !== undefined) docUpdate.gender = gender;
      if (dateOfBirth !== undefined) docUpdate.date_of_birth = dateOfBirth || null;
      if (medicalCouncilId !== undefined) docUpdate.medical_council_id = medicalCouncilId;

      if (Object.keys(docUpdate).length > 0) {
        await (supabaseAdmin || supabase).from('doctors').update(docUpdate).eq('user_id', userId);
      }
    } else if (userProfile?.role === 'Receptionist') {
      const { shift, joiningDate, idProofType, idProofNumber, educationLevel, experience: recExperience } = body;
      const recUpdate: any = {};
      if (gender !== undefined) recUpdate.gender = gender;
      if (dateOfBirth !== undefined) recUpdate.date_of_birth = dateOfBirth || null;
      if (shift !== undefined) recUpdate.shift = shift;
      if (joiningDate !== undefined) recUpdate.joining_date = joiningDate || null;
      if (idProofType !== undefined) recUpdate.id_proof_type = idProofType;
      if (idProofNumber !== undefined) recUpdate.id_proof_number = idProofNumber;
      if (recExperience !== undefined) recUpdate.experience = recExperience;
      if (educationLevel !== undefined) recUpdate.education_level = educationLevel;

      await (supabaseAdmin || supabase).from('receptionists').upsert({ user_id: userId, ...recUpdate }, { onConflict: 'user_id' });
    } else if (userProfile?.role === 'Admin') {
      const { joiningDate } = body;
      const adminUpdate: any = {};
      if (gender !== undefined) adminUpdate.gender = gender;
      if (dateOfBirth !== undefined) adminUpdate.date_of_birth = dateOfBirth || null;
      if (joiningDate !== undefined) adminUpdate.joining_date = joiningDate || null;

      await (supabaseAdmin || supabase).from('admins').upsert({ user_id: userId, ...adminUpdate }, { onConflict: 'user_id' });
    }

    const updatedProfile = await buildProfileResponse(userId);
    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
