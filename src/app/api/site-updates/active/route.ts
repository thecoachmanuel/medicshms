import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get active site update banners (public)
// GET /api/site-updates/active?slug=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const now = new Date().toISOString();

    let query = supabase
      .from('site_updates')
      .select('*, profiles:created_by(name, email)')
      .eq('is_active', true)
      .lte('start_date', now);
    
    // Proper OR filter for dates (Supabase/PostgREST syntax)
    query = query.or(`end_date.is.null,end_date.gte.${now}`);

    if (slug) {
      // Find hospital by slug
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (hospital) {
        // Show hospital specific OR global banners
        query = query.or(`hospital_id.eq.${hospital.id},hospital_id.is.null`);
      } else {
        return NextResponse.json({ success: true, banners: [], banner: null });
      }
    } else {
      // Global banners only (landing page)
      query = query.is('hospital_id', null);
    }

    const { data: banners, error } = await query.order('hospital_id', { ascending: false }).order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Site Updates Active API Error:', error);
      
      // During migration, the hospital_id column might be missing temporarily.
      // We handle this gracefully to prevent 500 errors in the GlobalBanner.
      if (error.code === '42703') { // Undefined Column (hospital_id)
        const { data: fallbackBanners } = await supabase
          .from('site_updates')
          .select('*, profiles:created_by(name, email)')
          .eq('is_active', true)
          .lte('start_date', now)
          .order('created_at', { ascending: false });
        
        const results = fallbackBanners || [];
        return NextResponse.json({
          success: true,
          banners: results.map(b => ({ ...b, _id: b.id, createdBy: b.profiles })),
          banner: results.length > 0 ? { ...results[0], _id: results[0].id, createdBy: results[0].profiles } : null
        });
      }
      
      throw error;
    }

    // hospital_id order (desc) means non-null comes first, then null.
    // So hospital specific banners take priority over global ones.

    return NextResponse.json({
      success: true,
      banners: (banners || []).map(b => ({ ...b, _id: b.id, createdBy: b.profiles })),
      banner: (banners || []).length > 0 ? { ...banners[0], _id: banners[0].id, createdBy: banners[0].profiles } : null
    });
  } catch (error: any) {
    console.error('💥 Site Updates Active API Crash:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
