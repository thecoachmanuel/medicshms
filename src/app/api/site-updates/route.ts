import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { isPlatformAdmin } from '@/lib/auth-helpers';

// Get all site update banners (Admin only)
// GET /api/site-updates
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Platform Admin']);
  if (authError) return authError;

  try {
    let query = supabase
      .from('site_updates')
      .select('*, profiles:created_by(name, email)');
    
    if (isPlatformAdmin(profile.role)) {
      query = query.is('hospital_id', null);
    } else {
      query = query.eq('hospital_id', profile.hospital_id);
    }

    const { data: banners, error } = await query.order('created_at', { ascending: false });

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
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Platform Admin']);
  if (authError) return authError;

  try {
    const { message, linkText, linkUrl, backgroundColor, textColor, startDate, endDate } = await request.json();

    // Sanitize dates: convert empty strings to null for optional columns
    const formattedStartDate = startDate && startDate.trim() !== '' ? startDate : new Date().toISOString();
    const formattedEndDate = endDate && endDate.trim() !== '' ? endDate : null;

    const { data: banner, error } = await supabase
      .from('site_updates')
      .insert([{
        message,
        link_text: linkText,
        link_url: linkUrl,
        background_color: backgroundColor,
        text_color: textColor,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        hospital_id: isPlatformAdmin(profile.role) ? null : profile.hospital_id,
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
