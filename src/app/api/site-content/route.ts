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

  if (targetHospitalId) {
    // Try to get hospital-specific content first, then fallback to global (hospital_id is null)
    // However, Supabase doesn't easily do "ordered fallback" in one select without complex logic.
    // We'll fetch both and prioritize hospital-specific in code, or just fetch hospital-specific.
    query = query.or(`hospital_id.eq.${targetHospitalId},hospital_id.is.null`);
  } else {
    query = query.is('hospital_id', null);
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

    // Process fallbacks: if we have both hospital-specific and global for a section, keep hospital-specific
    const sectionsMap = new Map();
    (data || []).forEach(item => {
      const key = `${item.page_path}:${item.section_key}`;
      if (!sectionsMap.has(key) || item.hospital_id !== null) {
        sectionsMap.set(key, item);
      }
    });

    return NextResponse.json(Array.from(sectionsMap.values()));
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
