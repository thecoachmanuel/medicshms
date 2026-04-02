import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth, getAuthUser } from '@/lib/auth';

// GET /api/site-settings
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const domain = searchParams.get('domain');
  const hospitalId = searchParams.get('hospital_id');

  try {
    const profile = await getAuthUser(request);
    const client = supabaseAdmin || supabase;
    
    // 1. Resolve target hospital ID
    // We only use explicitly provided hospitalId or slug.
    // Fallback to profile?.hospital_id is removed to ensure strict isolation
    // of platform settings (hospital_id is NULL) from tenant settings.
    let targetHospitalId = hospitalId;
    
    if (!targetHospitalId) {
      if (domain) {
        const { data: hosp } = await client.from('hospitals').select('id').eq('custom_domain', domain).maybeSingle();
        if (hosp) targetHospitalId = hosp.id;
      } else if (slug) {
        const { data: hosp } = await client.from('hospitals').select('id').eq('slug', slug).maybeSingle();
        if (hosp) targetHospitalId = hosp.id;
      }
    }
    
    // 2. Fetch Global Settings (fallback source)
    const { data: globalSettings } = await client
      .from('site_settings')
      .select('*')
      .is('hospital_id', null)
      .maybeSingle();

    // 3. Fetch Hospital-Specific Settings
    let hospitalSettings = null;
    if (targetHospitalId) {
      const { data: hSettings } = await client
        .from('site_settings')
        .select('*')
        .eq('hospital_id', targetHospitalId)
        .maybeSingle();
      hospitalSettings = hSettings;
    }

    // 4. Resolve Hospital Defaults from hospitals table (branding only)
    let hospitalDefaults: any = {};
    if (targetHospitalId) {
      const { data: hData } = await client.from('hospitals').select('name, logo_url, slug, custom_domain').eq('id', targetHospitalId).maybeSingle();
      if (hData) {
        hospitalDefaults = {
          hospital_name: hData.name,
          logo_url: hData.logo_url,
          hospital_id: targetHospitalId,
          slug: hData.slug,
          custom_domain: hData.custom_domain
        };
      }
    }

    // 5. Merge Strategy: Hospital Settings > Hospital Defaults > Global Settings
    // This ensures that branding (name/logo) from the hospital table is the absolute fallback,
    // but specific settings in site_settings (if they exist) override them.
    const finalSettings = {
      ...(globalSettings || {}),
      ...hospitalDefaults,
      ...(hospitalSettings || {})
    };

    // Eliminate ID and internal fields from merged results to prevent confusion
    if (hospitalSettings?.id) finalSettings.id = hospitalSettings.id;
    else if (globalSettings?.id) delete finalSettings.id; 

    return NextResponse.json({ 
      data: finalSettings 
    });
  } catch (error: any) {
    console.error('Site settings fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch site settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Platform Admin']) as any;
  if (authError) return authError;

  try {
    const body = await request.json();
    
    // Resolve target hospital:
    // If Admin, they can ONLY update their own.
    // If platform_admin, they can update the one in the body, or global (null) if none.
    let targetHospitalId = profile.role === 'Admin' ? profile.hospital_id : (body.hospital_id || null);

    // Sanitize body to only include allowed fields
    const allowedFields = [
      'hospital_name', 'hospital_short_name', 'logo_url', 'favicon_url',
      'theme_color', 'primary_color', 'secondary_color', 
      'contact_email', 'contact_phone', 'address', 'emergency_phone', 
      'maintenance_mode', 'sms_notifications', 'allow_public_registration',
      'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'security_settings'
    ];
    
    const sanitizedBody: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        sanitizedBody[field] = body[field];
      }
    });

    const client = supabaseAdmin || supabase;
    
    // 1. Check if settings exist for THIS hospital
    let query = client.from('site_settings').select('id');
    if (targetHospitalId) {
      query = query.eq('hospital_id', targetHospitalId);
    } else {
      query = query.is('hospital_id', null);
    }
    
    const { data: existing, error: fetchError } = await query.maybeSingle();

    if (fetchError) throw fetchError;

    let result;
    if (existing) {
      result = await client
        .from('site_settings')
        .update({
          ...sanitizedBody,
          updated_at: new Date().toISOString(),
          updated_by: profile.id
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await client
        .from('site_settings')
        .insert([{
          ...sanitizedBody,
          hospital_id: targetHospitalId,
          updated_by: profile.id
        }])
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // 2. Handle Hospital Slug update if provided
    if (targetHospitalId && body.slug) {
      const newSlug = body.slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug is unique
      const { data: existingHosp } = await client
        .from('hospitals')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', targetHospitalId)
        .maybeSingle();

      if (existingHosp) {
        return NextResponse.json({ message: 'This site link is already in use' }, { status: 400 });
      }

      const { error: slugError } = await client
        .from('hospitals')
        .update({ slug: newSlug })
        .eq('id', targetHospitalId);

      if (slugError) throw slugError;
      
      // Update result data to include new slug if needed for frontend
      result.data.slug = newSlug;
    }

    // 3. Handle Custom Domain update if provided (Sanitize and update hospitals table)
    if (targetHospitalId && body.custom_domain !== undefined) {
      const newDomain = body.custom_domain?.toLowerCase().trim() || null;

      if (newDomain) {
        // Check if domain is unique
        const { data: existingHosp } = await client
          .from('hospitals')
          .select('id')
          .eq('custom_domain', newDomain)
          .neq('id', targetHospitalId)
          .maybeSingle();

        if (existingHosp) {
          return NextResponse.json({ message: 'This custom domain is already in use by another hospital' }, { status: 400 });
        }
      }

      const { error: domainError } = await client
        .from('hospitals')
        .update({ custom_domain: newDomain })
        .eq('id', targetHospitalId);

      if (domainError) throw domainError;
      
      // Update result data to include new domain
      result.data.custom_domain = newDomain;
    }

    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    console.error('Site settings update error:', error);
    return NextResponse.json({ 
      message: 'Failed to update site settings',
      error: error.message || error 
    }, { status: 500 });
  }
}
