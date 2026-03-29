import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/services/storageService';

// POST /api/profile/upload-photo
export async function POST(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Delete existing photo if it exists (check profiles table first)
    const { data: profileRecord } = await supabase
      .from('profiles')
      .select('profile_photo')
      .eq('id', userProfile.id)
      .single();

    if (profileRecord?.profile_photo) {
      await deleteFromCloudinary(profileRecord.profile_photo);
    }

    // Upload new photo
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToCloudinary(buffer, 'profile-photos');

    // 1. Update profiles table (Source of Truth)
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ profile_photo: url, updated_at: new Date().toISOString() })
      .eq('id', userProfile.id);

    if (profileUpdateError) throw profileUpdateError;

    // 2. Update role-specific table for backward compatibility
    let tableName = '';
    if (userProfile.role === 'Doctor') tableName = 'doctors';
    else if (userProfile.role === 'Receptionist') tableName = 'receptionists';
    else if (userProfile.role === 'Admin') tableName = 'admins';

    if (tableName) {
      await supabase
        .from(tableName)
        .update({ profile_photo: url, updated_at: new Date().toISOString() })
        .eq('user_id', userProfile.id);
    }

    return NextResponse.json({ url, message: 'Profile photo uploaded successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
