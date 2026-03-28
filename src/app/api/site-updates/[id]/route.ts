import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get single site update banner (Admin only)
// GET /api/site-updates/:id
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin', 'platform_admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { data: banner, error } = await supabase
      .from('site_updates')
      .select('*, profiles:created_by(name, email)')
      .eq('id', id)
      .single();

    if (error || !banner) {
      return NextResponse.json({
        success: false,
        message: 'Banner not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      banner: { ...banner, _id: banner.id, createdBy: banner.profiles }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Update site update banner (Admin only)
// PUT /api/site-updates/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin', 'platform_admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { message, linkText, linkUrl, backgroundColor, textColor, startDate, endDate, isActive } = await request.json();

    const { data: banner, error } = await supabase
      .from('site_updates')
      .update({
        message,
        link_text: linkText,
        link_url: linkUrl,
        background_color: backgroundColor,
        text_color: textColor,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !banner) {
      return NextResponse.json({
        success: false,
        message: 'Banner not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Site update banner updated successfully',
      banner: { ...banner, _id: banner.id }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Delete site update banner (Admin only)
// DELETE /api/site-updates/:id
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin', 'platform_admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { error } = await supabase
      .from('site_updates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Site update banner deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
