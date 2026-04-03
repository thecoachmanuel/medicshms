import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get users by role
export async function GET(
  request: Request,
  { params }: { params: Promise<{ role: string }> }
) {
  const { error: authError, profile: adminProfile, supabase: supabaseClient } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { role } = await params;
  const client = (supabaseAdmin || supabaseClient);

  try {
    const validRoles = ['Admin', 'Doctor', 'Receptionist', 'Nurse', 'Lab Scientist', 'Pharmacist', 'Radiologist'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    // Fetch users from profiles table
    const { data: users, error } = await client
      .from('profiles')
      .select('*')
      .eq('role', role)
      .eq('hospital_id', adminProfile?.hospital_id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    if (!users || users.length === 0) return NextResponse.json({ data: [] });

    // Fetch role-specific details (including department)
    let specializationTable = '';
    switch (role) {
      case 'Doctor': specializationTable = 'doctors'; break;
      case 'Nurse': specializationTable = 'nurses'; break;
      case 'Lab Scientist': specializationTable = 'lab_scientists'; break;
      case 'Pharmacist': specializationTable = 'pharmacists'; break;
      case 'Radiologist': specializationTable = 'radiologists'; break;
      case 'Receptionist': specializationTable = 'receptionists'; break;
      case 'Admin': specializationTable = 'admins'; break;
    }

    if (specializationTable) {
      const { data: details, error: detailError } = await client
        .from(specializationTable)
        .select('*, department:department_id(name)')
        .eq('hospital_id', adminProfile?.hospital_id)
        .in('user_id', users.map(u => u.id));

      if (detailError) {
        console.error(`[Detail Fetch Error] ${specializationTable}:`, detailError.message);
      }

      const usersWithDetails = users.map(user => {
        const detail = details?.find(d => d.user_id === user.id);
        return {
          ...user,
          _id: user.id,
          isActive: user.is_active,
          department: detail?.department?.name || 'Unassigned',
          departmentId: detail?.department_id,
          specializationInfo: detail
        };
      });
      return NextResponse.json({ data: usersWithDetails });
    }

    return NextResponse.json({ data: users.map(u => ({ ...u, _id: u.id, isActive: u.is_active })) });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
