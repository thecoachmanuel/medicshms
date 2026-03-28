import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/services/storageService';

// POST /api/profile/upload-id-document (Receptionist only)
export async function POST(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Receptionist']);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('idDocument') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const { data: record } = await supabase
      .from('receptionists')
      .select('id_proof_document')
      .eq('user_id', userProfile.id)
      .single();

    if (!record) {
      return NextResponse.json({ message: 'Receptionist profile not found' }, { status: 404 });
    }

    // Delete existing document if it exists
    if (record.id_proof_document) {
      await deleteFromCloudinary(record.id_proof_document);
    }

    // Upload new document
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToCloudinary(buffer, 'id-documents');

    // Update database
    const { error: updateError } = await supabase
      .from('receptionists')
      .update({ id_proof_document: url })
      .eq('user_id', userProfile.id);

    if (updateError) throw updateError;

    return NextResponse.json({ url, message: 'ID document uploaded successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
