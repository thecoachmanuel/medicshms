import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/services/storageService';

// POST /api/profile/upload-signature
export async function POST(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('signature') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Determine target table and existing signature
    let tableName = '';
    if (userProfile.role === 'Doctor') tableName = 'doctors';
    else if (userProfile.role === 'Receptionist') tableName = 'receptionists';
    else if (userProfile.role === 'Admin') tableName = 'admins';
    else return NextResponse.json({ message: 'Role not supported for signature upload' }, { status: 403 });

    const { data: record } = await supabase
      .from(tableName)
      .select('digital_signature')
      .eq('user_id', userProfile.id)
      .single();

    if (!record) {
      return NextResponse.json({ message: 'Profile record not found' }, { status: 404 });
    }

    // Delete existing signature if it exists
    if (record.digital_signature) {
      await deleteFromCloudinary(record.digital_signature);
    }

    // Upload new signature
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToCloudinary(buffer, 'signatures');

    // Update database
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ digital_signature: url })
      .eq('user_id', userProfile.id);

    if (updateError) throw updateError;

    return NextResponse.json({ url, message: 'Digital signature uploaded successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
