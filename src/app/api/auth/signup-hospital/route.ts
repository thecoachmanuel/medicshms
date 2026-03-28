import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { 
      hospital_name, 
      hospital_email, 
      admin_name, 
      admin_email, 
      password, 
      phone 
    } = await request.json();

    // 1. Generate slug from hospital name
    const slug = hospital_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const client = supabaseAdmin || supabase;

    // 2. Create hospital record
    const { data: hospital, error: hospitalError } = await client
      .from('hospitals')
      .insert([
        {
          name: hospital_name,
          slug,
          email: hospital_email,
          status: 'active',
          subscription_status: 'trial',
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ])
      .select()
      .single();

    if (hospitalError) {
      console.error('Hospital creation error:', hospitalError);
      return NextResponse.json({ message: 'Failed to create hospital: ' + hospitalError.message }, { status: 400 });
    }

    // 3. Register the admin user (bypass email confirmation if admin client is available)
    let authData, authError;

    if (supabaseAdmin) {
      const result = await supabaseAdmin.auth.admin.createUser({
        email: admin_email,
        password,
        email_confirm: true,
        user_metadata: {
          name: admin_name,
          role: 'Admin',
          hospital_id: hospital.id
        }
      });
      authData = { user: result.data.user };
      authError = result.error;
    } else {
      const result = await supabase.auth.signUp({
        email: admin_email,
        password,
        options: {
          data: {
            name: admin_name,
            role: 'Admin',
            hospital_id: hospital.id
          }
        }
      });
      authData = result.data;
      authError = result.error;
    }

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    const { user } = authData;
    if (!user) {
      return NextResponse.json({ message: 'Admin registration failed' }, { status: 400 });
    }

    // 4. Create profile for the admin
    const { error: profileError } = await client
      .from('profiles')
      .insert([
        {
          id: user.id,
          name: admin_name,
          email: admin_email,
          phone: phone,
          role: 'Admin',
          hospital_id: hospital.id,
          is_active: true
        }
      ]);

    if (profileError) {
      console.error('Admin profile error:', profileError);
      return NextResponse.json({ message: 'Hospital created but admin profile failed: ' + profileError.message }, { status: 400 });
    }

    // 5. Initialize Site Settings for the new hospital
    const { error: settingsError } = await client
      .from('site_settings')
      .insert([
        {
          hospital_id: hospital.id,
          hospital_name: hospital_name,
          hospital_short_name: hospital_name.split(' ')[0], // Default short name
          theme_color: '#2563eb', // Default theme color
          updated_at: new Date().toISOString(),
        }
      ]);

    if (settingsError) {
      console.error('Site settings initialization error:', settingsError);
      // We don't fail the whole signup if settings fails, but we log it
    }

    return NextResponse.json({ 
      message: 'Hospital and Admin account created successfully',
      hospital_id: hospital.id,
      slug: slug
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
