import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { isPlatformAdmin } from '@/lib/auth-helpers';

// GET /api/notifications
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request);
  if (authError) return authError;

  try {
    const client = supabaseAdmin || supabase;
    
    // Fetch notifications for the specific user OR their role (if tied to hospital or platform)
    let query = client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by user_id OR (hospital_id AND role)
    if (isPlatformAdmin(profile.role)) {
      // Platform admins see global notifications (no hospital_id) targeted at their role
      query = query.or(`user_id.eq.${profile.id},and(hospital_id.is.null,role.eq.platform_admin)`);
    } else {
      // Hospital users see their own OR role-based within hospital
      query = query.or(`user_id.eq.${profile.id},and(hospital_id.eq.${profile.hospital_id},role.eq.${profile.role})`);
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PUT /api/notifications/read-all
// OR /api/notifications/[id]/read is handled in a dynamic route, but we can do a general PUT here for read-all
export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request);
  if (authError) return authError;

  try {
    const { id, readAll } = await request.json();
    const client = supabaseAdmin || supabase;

    if (readAll) {
      // Mark all as read for this user/role
      let query = client
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() });

      if (isPlatformAdmin(profile.role)) {
        query = query.or(`user_id.eq.${profile.id},and(hospital_id.is.null,role.eq.platform_admin)`);
      } else {
        query = query.or(`user_id.eq.${profile.id},and(hospital_id.eq.${profile.hospital_id},role.eq.${profile.role})`);
      }

      const { error } = await query;
      if (error) throw error;
    } else if (id) {
      const { error } = await client
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notification update error:', error);
    return NextResponse.json({ message: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE /api/notifications
export async function DELETE(request: Request) {
  const { error: authError, profile } = await withAuth(request);
  if (authError) return authError;

  try {
    const { id } = await request.json();
    const client = supabaseAdmin || supabase;

    const { error } = await client
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notification delete error:', error);
    return NextResponse.json({ message: 'Failed to delete notification' }, { status: 500 });
  }
}
