import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();
    const isEmail = identifier.includes('@');

    // Login with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      [isEmail ? 'email' : 'phone']: identifier,
      password,
    } as any);

    if (error) {
      return NextResponse.json({ message: error.message || 'Invalid credentials' }, { status: 401 });
    }

    const user = data.user;

    // Fetch profile using Admin client to bypass any initial RLS issues during login
    const { data: profile, error: profileError } = await (supabaseAdmin || supabase)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    if (!profile.is_active) {
      return NextResponse.json({ message: 'Your account has been deactivated. Please contact administrator.' }, { status: 403 });
    }

    // 3. Track last login and sync metadata to JWT
    if (supabaseAdmin) {
      await Promise.all([
        supabaseAdmin.from('profiles').update({ last_login: new Date() }).eq('id', user.id),
        supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: { 
            ...user.user_metadata,
            role: profile.role,
            hospital_id: profile.hospital_id 
          }
        })
      ]);
    } else {
      await supabase.from('profiles').update({ last_login: new Date() }).eq('id', user.id);
    }

    // 4. Fetch hospital slug for redirection
    let hospitalSlug = '';
    if (profile.hospital_id) {
      const { data: hosp, error: hError } = await (supabaseAdmin || supabase)
        .from('hospitals')
        .select('slug')
        .eq('id', profile.hospital_id)
        .single();
      
      if (hError) console.error('[Login API] Hospital fetch error:', hError.message);
      hospitalSlug = hosp?.slug || '';
      console.log(`[Login API] Resolved slug for hospital ${profile.hospital_id}: "${hospitalSlug}"`);
    } else {
      console.log('[Login API] No hospital_id found for user:', user.email);
    }

    return NextResponse.json({
      _id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      hospital_id: profile.hospital_id,
      hospital_slug: hospitalSlug,
      token: data.session.access_token,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
