import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/services/storageService';

// DELETE /api/profile/photo
export async function DELETE(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request);
  if (authError) return authError;

  try {
    // 1. Get current photo URL from profiles
    const { data: record } = await supabase
      .from('profiles')
      .select('profile_photo')
      .eq('id', userProfile.id)
      .single();

    if (record?.profile_photo) {
      // 2. Delete from Cloudinary
      await deleteFromCloudinary(record.profile_photo);
      
      // 3. Update profiles table
      await supabase
        .from('profiles')
        .update({ profile_photo: null, updated_at: new Date().toISOString() })
        .eq('id', userProfile.id);

      // 4. Update role-specific table for backward compatibility
      let tableName = '';
      if (userProfile.role === 'Doctor') tableName = 'doctors';
      else if (userProfile.role === 'Receptionist') tableName = 'receptionists';
      else if (userProfile.role === 'Admin') tableName = 'admins';

      if (tableName) {
        await supabase
          .from(tableName)
          .update({ profile_photo: null, updated_at: new Date().toISOString() })
          .eq('user_id', userProfile.id);
      }
    }

    return NextResponse.json({ message: 'Profile photo deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
