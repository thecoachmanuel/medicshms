import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request);
  if (authError) return authError;

  try {
    const client = supabaseAdmin || supabase;

    let query = client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false);

    if (profile.role === 'platform_admin') {
      query = query.or(`user_id.eq.${profile.id},and(hospital_id.is.null,role.eq.platform_admin)`);
    } else {
      query = query.or(`user_id.eq.${profile.id},and(hospital_id.eq.${profile.hospital_id},role.eq.${profile.role})`);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notification mark all as read error:', error);
    return NextResponse.json({ message: 'Failed to mark all notifications as read' }, { status: 500 });
  }
}
