import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Toggle announcement status (Admin only)
// PATCH /api/announcements/:id/toggle
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { data: current, error: getError } = await supabase
      .from('announcements')
      .select('is_active')
      .eq('id', id)
      .single();

    if (getError || !current) {
      return NextResponse.json({
        success: false,
        message: 'Announcement not found'
      }, { status: 404 });
    }

    const { data: announcement, error: updateError } = await supabase
      .from('announcements')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: `Announcement ${announcement.is_active ? 'activated' : 'deactivated'} successfully`,
      announcement: { ...announcement, _id: announcement.id }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
