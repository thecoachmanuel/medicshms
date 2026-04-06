import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { normalizeRole } from '@/lib/auth-helpers';

// Get users by role
export async function GET(
  request: Request,
  { params }: { params: Promise<{ role: string }> }
) {
  const { error: authError, profile: adminProfile, supabase: supabaseClient } = await withAuth(request, ['Admin', 'Lab Scientist']);
  if (authError) return authError;

  const { role: rawRole } = await params;
  const role = normalizeRole(rawRole);
  const client = (supabaseAdmin || supabaseClient);

  try {
    const validRoles = ['admin', 'doctor', 'receptionist', 'nurse', 'lab_scientist', 'pharmacist', 'radiologist'];
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
      case 'doctor': specializationTable = 'doctors'; break;
      case 'nurse': specializationTable = 'nurses'; break;
      case 'lab_scientist': specializationTable = 'lab_scientists'; break;
      case 'pharmacist': specializationTable = 'pharmacists'; break;
      case 'radiologist': specializationTable = 'radiologists'; break;
      case 'receptionist': specializationTable = 'receptionists'; break;
      case 'admin': specializationTable = 'admins'; break;
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
