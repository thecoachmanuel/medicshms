import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get active site update banners (public)
// GET /api/site-updates/active
export async function GET() {
  try {
    const now = new Date().toISOString();
    const { data: banners, error } = await supabase
      .from('site_updates')
      .select('*, profiles:created_by(name, email)')
      .eq('is_active', true)
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      banners: banners.map(b => ({ ...b, _id: b.id, createdBy: b.profiles })),
      banner: banners.length > 0 ? { ...banners[0], _id: banners[0].id, createdBy: banners[0].profiles } : null
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
