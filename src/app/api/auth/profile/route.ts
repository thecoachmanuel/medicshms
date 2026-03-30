import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { buildProfileResponse } from '@/lib/profile';

export async function GET(request: Request) {
  try {
    const profile = await getAuthUser(request);

    if (!profile) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const fullProfile = await buildProfileResponse(profile.id);
    return NextResponse.json(fullProfile);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const profile = await getAuthUser(request);

    if (!profile) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const { name, phone } = await request.json();
    
    // 1. Update base profile
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    updateData.updated_at = new Date().toISOString();

    const { error: profileError } = await (supabaseAdmin || supabase)
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (profileError) throw profileError;

    // 2. Update role-specific table for backward compatibility if needed
    // (Wait, name and phone are only in the profiles table, 
    // but some apps might rely on duplicated data in doctors/receptionists/admins if it exists)
    // Actually, according to initial_schema, name and phone are ONLY in profiles.
    // However, some role tables have additional fields like gender, date_of_birth etc.
    // For now, we only update name and phone as requested by the profile UI.

    const updatedProfile = await buildProfileResponse(profile.id);
    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
