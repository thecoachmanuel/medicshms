import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Platform Admin']);
  if (authError) return authError;

  try {
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    // Fetch all hospitals
    const { data: hospitals, error: hospitalsError } = await client
      .from('hospitals')
      .select('*')
      .order('created_at', { ascending: false });

    if (hospitalsError) throw hospitalsError;

    // Calculate stats
    const stats = {
      total: hospitals.length,
      active: hospitals.filter(h => h.subscription_status === 'active').length,
      trial: hospitals.filter(h => h.subscription_status === 'trial').length,
      expired: hospitals.filter(h => h.subscription_status === 'expired').length,
      paused: hospitals.filter(h => h.subscription_status === 'paused').length,
      suspended: hospitals.filter(h => h.subscription_status === 'suspended').length
    };

    return NextResponse.json({ success: true, data: { hospitals, stats } });
  } catch (error: any) {
    console.error('Platform admin fetch error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError } = await withAuth(request, ['Platform Admin']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { name, slug, email, custom_domain, subscription_status, institution_type } = body;
    const finalSlug = slug || name.toLowerCase().replace(/ /g, '-');

    // 1. Check for duplicates manually for better error message
    const { data: existing } = await client
      .from('hospitals')
      .select('id, slug, email')
      .or(`slug.eq.${finalSlug},email.eq.${email}`)
      .single();

    if (existing) {
      const conflict = existing.slug === finalSlug ? 'Slug' : 'Email';
      return NextResponse.json({ message: `${conflict} is already in use by another hospital.` }, { status: 400 });
    }

    const { data: hospital, error } = await client
      .from('hospitals')
      .insert([
        { 
          name, 
          slug: finalSlug, 
          email, 
          custom_domain: custom_domain || null,
          subscription_status: subscription_status || 'trial',
          institution_type: institution_type || 'hospital',
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // 2. Create the first Admin user for this hospital
    const adminPassword = 'hms@admin';
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { 
        name: `${name} Admin`, 
        role: 'Admin',
        hospital_id: hospital.id 
      }
    });

    if (authError) {
      console.error('Failed to create hospital admin auth user:', authError.message);
      // If user already exists, we might want to link it, but for fresh launch we expect new user
    } else {
      // Create profile for the new admin
      const { error: profileError } = await client
        .from('profiles')
        .insert([{
          id: authData.user.id,
          name: `${name} Admin`,
          email,
          role: 'Admin',
          hospital_id: hospital.id,
          is_active: true
        }]);

      if (profileError) {
        console.error('Failed to create hospital admin profile:', profileError.message);
      }
    }

    // 3. Initialize site settings for the new hospital
    const { error: settingsError } = await client
      .from('site_settings')
      .insert([{
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        hospital_short_name: hospital.name.substring(0, 10),
        primary_color: '#2563eb',
        secondary_color: '#0f172a',
        contact_email: hospital.email,
        emergency_phone: '+1 (800) 123-4567',
        institution_type: hospital.institution_type || 'hospital'
      }]);

    if (settingsError) {
      console.error('Failed to initialize site settings:', settingsError);
    }

    return NextResponse.json({ success: true, data: hospital });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
