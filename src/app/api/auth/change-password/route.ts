import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function PATCH(request: Request) {
  const { profile: userProfile, error: authError } = await withAuth(request);
  if (authError || !userProfile) return authError || NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Admin configuration missing' }, { status: 500 });
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userProfile.id,
      { password: newPassword }
    );

    if (updateError) {
      return NextResponse.json({ message: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
