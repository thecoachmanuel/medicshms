import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Update user details
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile: adminProfile, supabase: supabaseClient } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Supabase Admin client not configured' }, { status: 500 });
  }

  const { id } = await params;

  try {
    const client = (supabaseAdmin || supabaseClient);

    const { name, email, phone, isActive, departmentId } = await request.json();

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: profile, error } = await client
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .eq('hospital_id', adminProfile?.hospital_id)
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    // Handle role-specific updates (including department for all clinical staff)
    const specializationUpdate: any = {};
    if (departmentId) specializationUpdate.department_id = departmentId;
    if (isActive !== undefined) specializationUpdate.is_active = isActive;

    if (Object.keys(specializationUpdate).length > 0) {
      let specializationTable = '';
      switch (profile.role) {
        case 'Doctor': specializationTable = 'doctors'; break;
        case 'Nurse': specializationTable = 'nurses'; break;
        case 'Lab Scientist': specializationTable = 'lab_scientists'; break;
        case 'Pharmacist': specializationTable = 'pharmacists'; break;
        case 'Radiologist': specializationTable = 'radiologists'; break;
        case 'Receptionist': specializationTable = 'receptionists'; break;
        case 'Admin': specializationTable = 'admins'; break;
      }

      if (specializationTable) {
        const { error: specError } = await client
          .from(specializationTable)
          .update(specializationUpdate)
          .eq('user_id', id)
          .eq('hospital_id', adminProfile?.hospital_id);
          
        if (specError) {
          console.error(`[Specialization Update Error] ${specializationTable}:`, specError.message);
        }
      }
    }

    // If email changed, also update it in Supabase Auth
    if (email) {
      await supabaseAdmin.auth.admin.updateUserById(id, { email });
    }

    return NextResponse.json({
      _id: profile.id,
      ...profile,
      isActive: profile.is_active,
      createdAt: profile.created_at
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile: adminProfile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Supabase Admin client not configured' }, { status: 500 });
  }

  const { id } = await params;

  try {
    if (id === adminProfile?.id) {
      return NextResponse.json({ message: 'You cannot delete your own account' }, { status: 400 });
    }

    // Delete from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
