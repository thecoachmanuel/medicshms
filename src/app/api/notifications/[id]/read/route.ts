import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error: authError } = await withAuth(request);
  if (authError) return authError;

  try {
    const { id } = params;
    const client = supabaseAdmin || supabase;

    const { error } = await client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notification mark as read error:', error);
    return NextResponse.json({ message: 'Failed to mark notification as read' }, { status: 500 });
  }
}
