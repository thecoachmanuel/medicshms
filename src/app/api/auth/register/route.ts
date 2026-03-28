import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, email, password, role, phone, hospital_id } = await request.json();

    // 1. Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: role || 'Patient',
          phone,
          hospital_id
        }
      }
    });

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    const user = authData.user;

    if (!user) {
      return NextResponse.json({ message: 'User registration failed' }, { status: 400 });
    }

    // 2. Create profile in profiles table
    const { data: profile, error: profileError } = await (supabaseAdmin || supabase)
      .from('profiles')
      .insert([
        {
          id: user.id,
          name,
          email,
          phone,
          role: role || 'Patient',
          hospital_id,
          is_active: true
        }
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json({ message: 'User created but profile failed: ' + profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      _id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      token: authData.session?.access_token,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
