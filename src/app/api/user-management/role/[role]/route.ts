import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get users by role
export async function GET(
  request: Request,
  { params }: { params: Promise<{ role: string }> }
) {
  const { error: authError, profile: adminProfile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { role } = await params;

  try {
    if (!['Admin', 'Doctor', 'Receptionist'].includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    // Fetch users from profiles table
    const { data: users, error } = await (supabaseAdmin || supabase)
      .from('profiles')
      .select('*')
      .eq('role', role)
      .eq('hospital_id', adminProfile?.hospital_id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    // If fetching doctors, join with doctors table info
    if (role === 'Doctor') {
      const { data: doctors, error: docError } = await (supabaseAdmin || supabase)
        .from('doctors')
        .select('*, department:department_id(name)')
        .eq('hospital_id', adminProfile?.hospital_id)
        .in('user_id', users.map(u => u.id));

      const usersWithInfo = users.map(user => {
        const doctor = doctors?.find(d => d.user_id === user.id);
        return {
          ...user,
          _id: user.id,
          isActive: user.is_active,
          doctorInfo: doctor ? {
            primaryDepartment: doctor.department,
            departmentId: doctor.department_id
          } : null
        };
      });
      return NextResponse.json({ data: usersWithInfo });
    }

    return NextResponse.json({ data: users.map(u => ({ ...u, _id: u.id, isActive: u.is_active })) });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
