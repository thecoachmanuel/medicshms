import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile: adminProfile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { data: profile } = await (supabaseAdmin || supabase)
      .from('profiles')
      .select('role')
      .eq('id', id)
      .eq('hospital_id', adminProfile?.hospital_id)
      .single();
    if (!profile) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    let newPassword = '';
    switch (profile.role) {
      case 'Doctor': newPassword = 'hms@doctor'; break;
      case 'Receptionist': newPassword = 'hms@receptionist'; break;
      case 'Admin': newPassword = 'hms@admin'; break;
      default: newPassword = 'hms@default';
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Supabase Admin client not configured' }, { status: 500 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
