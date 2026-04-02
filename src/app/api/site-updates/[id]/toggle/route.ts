import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Toggle banner active status (Admin only)
// PUT /api/site-updates/:id/toggle
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin', 'Platform Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { data: banner, error: fetchError } = await supabase
      .from('site_updates')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError || !banner) {
      return NextResponse.json({
        success: false,
        message: 'Banner not found'
      }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('site_updates')
      .update({ is_active: !banner.is_active })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: `Banner ${updated.is_active ? 'activated' : 'deactivated'} successfully`,
      banner: { ...updated, _id: updated.id }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
