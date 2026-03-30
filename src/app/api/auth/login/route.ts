import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { identifier: rawIdentifier, password } = await request.json();
    const identifier = rawIdentifier?.trim();
    console.log(`[Login API] Attempting login for identifier: "${identifier}"`);

    let loginIdentifier = identifier;
    const isEmail = identifier.includes('@');

    const client = supabaseAdmin || supabase;

    // 1. Phone-to-Email Fallback
    // If identifier is a phone number, resolve it to an email from the profiles table
    if (!isEmail) {
      console.log(`[Login API] Identifier looks like a phone number. Resolving to email...`);
      const { data: profileByPhone, error: phoneError } = await client
        .from('profiles')
        .select('email')
        .eq('phone', identifier)
        .maybeSingle();

      if (profileByPhone?.email) {
        console.log(`[Login API] Resolved phone "${identifier}" to email "${profileByPhone.email}"`);
        loginIdentifier = profileByPhone.email;
      } else {
        console.warn(`[Login API] Could not resolve phone "${identifier}" to any profile. Proceeding with raw identifier.`);
      }
    }

    // 2. Authenticate with Supabase Auth
    // We always use 'email' for login if resolved or contains @, else fallback to 'phone'
    const authType = loginIdentifier.includes('@') ? 'email' : 'phone';
    console.log(`[Login API] Handing over to Supabase Auth with type: ${authType}`);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      [authType]: loginIdentifier,
      password,
    } as any);

    if (authError) {
      console.error(`[Login API] Supabase Auth Error:`, authError.message);
      return NextResponse.json({ 
        message: authError.message || 'Invalid credentials',
        details: 'Auth failed' 
      }, { status: 401 });
    }

    const user = data.user;
    console.log(`[Login API] Auth successful for UUID: ${user.id}`);

    // 3. Fetch profile using Admin client to bypass RLS
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error(`[Login API] Profile fetch error for UUID ${user.id}:`, profileError?.message);
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    if (!profile.is_active) {
      console.warn(`[Login API] Inactive user attempted login: ${user.email}`);
      return NextResponse.json({ message: 'Your account has been deactivated. Please contact administrator.' }, { status: 403 });
    }

    // 4. Track last login and sync metadata to JWT
    if (supabaseAdmin) {
      console.log(`[Login API] Syncing metadata for ${user.id} (Hospital: ${profile.hospital_id})`);
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

    // 5. Fetch hospital slug for redirection
    let hospitalSlug = '';
    if (profile.hospital_id) {
      const { data: hosp } = await client
        .from('hospitals')
        .select('slug')
        .eq('id', profile.hospital_id)
        .maybeSingle();
      
      hospitalSlug = hosp?.slug || '';
      console.log(`[Login API] Resolved hospital slug: "${hospitalSlug}"`);
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
    console.error('[Login API] Critical Catch Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
