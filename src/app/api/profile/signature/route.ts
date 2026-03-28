import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/services/storageService';

// DELETE /api/profile/signature
export async function DELETE(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request);
  if (authError) return authError;

  try {
    let tableName = '';
    if (userProfile.role === 'Doctor') tableName = 'doctors';
    else if (userProfile.role === 'Receptionist') tableName = 'receptionists';
    else if (userProfile.role === 'Admin') tableName = 'admins';
    else return NextResponse.json({ message: 'Role not supported' }, { status: 403 });

    const { data: record } = await supabase
      .from(tableName)
      .select('digital_signature')
      .eq('user_id', userProfile.id)
      .single();

    if (record && record.digital_signature) {
      await deleteFromCloudinary(record.digital_signature);
      await supabase.from(tableName).update({ digital_signature: '' }).eq('user_id', userProfile.id);
    }

    return NextResponse.json({ message: 'Digital signature removed' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
