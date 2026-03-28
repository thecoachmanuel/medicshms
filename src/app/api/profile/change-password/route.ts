import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// PUT /api/profile/change-password
export async function PUT(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request);
  if (authError) return authError;

  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Supabase Admin client not configured' }, { status: 500 });
  }

  try {
    const { newPassword, confirmPassword } = await request.json();

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }

    // Update password in Supabase Auth using the admin client
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userProfile.id, { password: newPassword });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
