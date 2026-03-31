import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// GET /api/site-content?page=home
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');
  const hospitalId = searchParams.get('hospital_id');
  const slug = searchParams.get('slug');

  const client = supabaseAdmin || supabase;
  
  let targetHospitalId = hospitalId;

  if (!targetHospitalId && slug) {
    const { data: hosp } = await client.from('hospitals').select('id').eq('slug', slug).single();
    if (hosp) targetHospitalId = hosp.id;
  }

  let query = client.from('site_content').select('*');

  // Strict isolation:
  // If we are looking for a specific tenant (either via hospital_id or slug)
  // we ONLY return that tenant's content. We do NOT fallback to "null" 
  // because "null" hospital_id represents the central SaaS platform content.
  if (targetHospitalId) {
    query = query.eq('hospital_id', targetHospitalId);
  } else if (!slug) {
    // If no hospital_id and no slug, we are strictly querying the SaaS platform landing page
    query = query.is('hospital_id', null);
  } else {
    // A slug was provided but hospital wasn't found
    return NextResponse.json([]);
  }

  if (page) {
    query = query.eq('page_path', page);
  }

  try {
    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('not found')) {
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Site content fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch site content' }, { status: 500 });
  }
}

// PUT /api/site-content
export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'platform_admin']);
  if (authError) return authError;

  try {
    const body = await request.json(); // Array of { page_path, section_key, content, hospital_id }
    
    // Sanitize and UPSERT content
    const sanitizedBody = body.map((item: any) => ({
      page_path: item.page_path,
      section_key: item.section_key,
      hospital_id: profile.role === 'platform_admin' ? null : profile.hospital_id,
      content: item.content,
      updated_by: profile.id,
      updated_at: new Date().toISOString()
    }));

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('site_content')
      .upsert(sanitizedBody, { onConflict: 'page_path,section_key,hospital_id' })
      .select();

    if (error) {
      console.error('Supabase Upsert Error:', error);
      throw error;
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Site content update error:', error);
    return NextResponse.json({ 
      message: 'Failed to update site content',
      error: error.message 
    }, { status: 500 });
  }
}
