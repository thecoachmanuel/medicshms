import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { identifier: rawIdentifier, password } = await request.json();
    const identifier = rawIdentifier?.trim();
    console.log(`[Login API] Full diagnostics for identifier: "${identifier}"`);

    let loginIdentifier = identifier;
    let isEmail = identifier.includes('@');

    const client = supabaseAdmin || supabase;
    console.log(`[Login API] Admin client available: ${!!supabaseAdmin}`);

    // Pre-check: Does user exist in profiles?
    const { data: preCheckProfile } = await client
      .from('profiles')
      .select('id, email, role, hospital_id')
      .or(`email.eq.${identifier},phone.eq.${identifier}`)
      .maybeSingle();

    if (preCheckProfile) {
      console.log(`[Login API] Pre-check found profile: ${preCheckProfile.id} | Role: ${preCheckProfile.role} | Email: ${preCheckProfile.email}`);
      // Use the email specifically from the profile for auth
      loginIdentifier = preCheckProfile.email;
      isEmail = true;

      // Deep Check: Does user exist in auth.users?
      if (supabaseAdmin) {
        const { data: authUser, error: authCheckError } = await supabaseAdmin.auth.admin.getUserById(preCheckProfile.id);
        if (authCheckError || !authUser?.user) {
          console.error(`[Login API] CRITICAL: Profile exists for ${loginIdentifier} but auth.users record is missing!`);
        } else {
          console.log(`[Login API] Auth record verified for ${loginIdentifier}. Proceeding to password check.`);
        }
      }
    } else {
      console.warn(`[Login API] Pre-check: No profile found for identifier "${identifier}"`);
    }

    // Force email to lowercase for auth
    if (isEmail) {
      loginIdentifier = loginIdentifier.toLowerCase();
    }

    // 2. Authenticate with Supabase Auth
    const authType = loginIdentifier.includes('@') ? 'email' : 'phone';
    console.log(`[Login API] Handing over to Supabase Auth with type: ${authType} and identifier: ${loginIdentifier}`);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      [authType]: loginIdentifier,
      password,
    } as any);

    if (authError) {
      console.error(`[Login API] Supabase Auth Error: [${authError.status}] ${authError.message}`);
      return NextResponse.json({ 
        message: `${authError.message} (User: ${loginIdentifier})`,
        details: 'Auth failed',
        code: (authError as any).code
      }, { status: 401 });
    }

    if (!data.session) {
      console.error(`[Login API] Login succeeded/no-error but no session returned for ${loginIdentifier}`);
      return NextResponse.json({ 
        message: 'Authentication partially successful, but no active session was created. Please confirm your email.',
        details: 'Missing session'
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
      return NextResponse.json({ message: 'User profile not found. Contact administrator.' }, { status: 404 });
    }

    if (!profile.is_active) {
      console.warn(`[Login API] Inactive user attempted login: ${user.email}`);
      return NextResponse.json({ message: 'Your personal account has been deactivated.' }, { status: 403 });
    }

    // 4. Fetch hospital and verify its status
    let hospitalSlug = '';
    if (profile.hospital_id) {
       const { data: hosp } = await client
        .from('hospitals')
        .select('slug, status')
        .eq('id', profile.hospital_id)
        .maybeSingle();
      
      if (hosp) {
        if (hosp.status !== 'active') {
          console.warn(`[Login API] Attempted login to inactive hospital (${hosp.slug}): ${user.email}`);
          return NextResponse.json({ message: 'Associated hospital account is currently inactive or suspended.' }, { status: 403 });
        }
        hospitalSlug = hosp.slug;
      }
      console.log(`[Login API] Resolved hospital status/slug: "${hospitalSlug}"`);
    }

    // 5. Track last login and sync metadata to JWT
    if (supabaseAdmin) {
      console.log(`[Login API] Syncing metadata for ${user.id} (Hospital: ${profile.hospital_id})`);
      // We don't await this to keep response fast, but catch errors
      Promise.all([
        supabaseAdmin.from('profiles').update({ last_login: new Date() }).eq('id', user.id),
        supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: { 
            ...user.user_metadata,
            role: profile.role,
            hospital_id: profile.hospital_id 
          }
        })
      ]).catch(err => console.error('[Login API] Metadata sync background error:', err));
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
    return NextResponse.json({ message: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}
