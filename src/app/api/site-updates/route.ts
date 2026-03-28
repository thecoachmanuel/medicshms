import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get all site update banners (Admin only)
// GET /api/site-updates
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'platform_admin']);
  if (authError) return authError;

  try {
    const { data: banners, error } = await supabase
      .from('site_updates')
      .select('*, profiles:created_by(name, email)')
      .eq('hospital_id', profile.role === 'platform_admin' ? null : profile.hospital_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: banners.length,
      banners: banners.map(b => ({ ...b, _id: b.id, createdBy: b.profiles }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Create site update banner (Admin only)
// POST /api/site-updates
export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'platform_admin']);
  if (authError) return authError;

  try {
    const { message, linkText, linkUrl, backgroundColor, textColor, startDate, endDate } = await request.json();

    const { data: banner, error } = await supabase
      .from('site_updates')
      .insert([{
        message,
        link_text: linkText,
        link_url: linkUrl,
        background_color: backgroundColor,
        text_color: textColor,
        start_date: startDate,
        end_date: endDate,
        hospital_id: profile.role === 'platform_admin' ? null : profile.hospital_id,
        created_by: profile?.id
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Site update banner created successfully',
      banner: { ...banner, _id: banner.id }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
