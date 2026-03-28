import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/services/storageService';

// DELETE /api/profile/id-document (Receptionist only)
export async function DELETE(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Receptionist']);
  if (authError) return authError;

  try {
    const { data: record } = await supabase
      .from('receptionists')
      .select('id_proof_document')
      .eq('user_id', userProfile.id)
      .single();

    if (record && record.id_proof_document) {
      await deleteFromCloudinary(record.id_proof_document);
      await supabase.from('receptionists').update({ id_proof_document: '' }).eq('user_id', userProfile.id);
    }

    return NextResponse.json({ message: 'ID document removed' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
