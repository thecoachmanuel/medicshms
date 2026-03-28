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

    // Determine target table and existing photo
    let tableName = '';
    if (userProfile.role === 'Doctor') tableName = 'doctors';
    else if (userProfile.role === 'Receptionist') tableName = 'receptionists';
    else if (userProfile.role === 'Admin') tableName = 'admins';
    else return NextResponse.json({ message: 'Role not supported for photo upload' }, { status: 403 });

    const { data: record } = await supabase
      .from(tableName)
      .select('profile_photo')
      .eq('user_id', userProfile.id)
      .single();

    if (!record) {
      return NextResponse.json({ message: 'Profile record not found' }, { status: 404 });
    }

    // Delete existing photo if it exists
    if (record.profile_photo) {
      await deleteFromCloudinary(record.profile_photo);
    }

    // Upload new photo
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToCloudinary(buffer, 'profile-photos');

    // Update database
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ profile_photo: url })
      .eq('user_id', userProfile.id);

    if (updateError) throw updateError;

    return NextResponse.json({ url, message: 'Profile photo uploaded successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
