import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Create a new user (Post)
export async function POST(request: Request) {
  const { error: authError, profile: adminProfile, supabase: supabaseClient } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Supabase Admin client not configured' }, { status: 500 });
  }

  try {
    const { name, email: rawEmail, phone, role, departmentId } = await request.json();
    const email = rawEmail?.trim().toLowerCase();

    const validRoles = ['Admin', 'Doctor', 'Receptionist', 'Nurse', 'Lab Scientist', 'Pharmacist', 'Radiologist'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    const client = (supabaseAdmin || supabaseClient);

    // Set default password based on role
    let defaultPassword = '';
    switch (role) {
      case 'Doctor': defaultPassword = 'hms@doctor'; break;
      case 'Receptionist': defaultPassword = 'hms@receptionist'; break;
      case 'Admin': defaultPassword = 'hms@admin'; break;
      case 'Nurse': defaultPassword = 'hms@nurse'; break;
      case 'Lab Scientist': defaultPassword = 'hms@lab'; break;
      case 'Pharmacist': defaultPassword = 'hms@pharmacy'; break;
      case 'Radiologist': defaultPassword = 'hms@radiology'; break;
      default: defaultPassword = 'hms@default';
    }

    // 1. Create user in Supabase Auth (requires SERVICE_ROLE_KEY)
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { name, role, phone, hospital_id: adminProfile?.hospital_id }
    });

    if (createAuthError) return NextResponse.json({ message: createAuthError.message }, { status: 400 });

    const user = authData.user;

    // 2. Create profile
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .insert([{ 
        id: user.id, 
        name, 
        email, 
        phone, 
        role,
        hospital_id: adminProfile?.hospital_id,
        is_active: true
      }])
      .select()
      .single();

    if (profileError) return NextResponse.json({ message: profileError.message }, { status: 400 });

    // 3. Auto-create role-specific profile
    const specializationData = { user_id: user.id, hospital_id: adminProfile?.hospital_id, department_id: departmentId };
    
    if (role === 'Doctor') {
      await client.from('doctors').insert([specializationData]);
    } else if (role === 'Receptionist') {
      await client.from('receptionists').insert([specializationData]);
    } else if (role === 'Admin') {
      await client.from('admins').insert([specializationData]);
    } else if (role === 'Nurse') {
      await client.from('nurses').insert([specializationData]);
    } else if (role === 'Lab Scientist') {
      await client.from('lab_scientists').insert([specializationData]);
    } else if (role === 'Pharmacist') {
      await client.from('pharmacists').insert([specializationData]);
    } else if (role === 'Radiologist') {
      await client.from('radiologists').insert([specializationData]);
    }

    return NextResponse.json({
      _id: profile.id,
      ...profile,
      isActive: profile.is_active,
      createdAt: profile.created_at
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
