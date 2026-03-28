import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile: adminProfile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    if (id === adminProfile?.id) {
      return NextResponse.json({ message: 'You cannot deactivate your own account' }, { status: 400 });
    }

    const { data: currentProfile } = await (supabaseAdmin || supabase)
      .from('profiles')
      .select('is_active')
      .eq('id', id)
      .eq('hospital_id', adminProfile?.hospital_id)
      .single();
    if (!currentProfile) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const newStatus = !currentProfile.is_active;

    const { data: profile, error } = await (supabaseAdmin || supabase)
      .from('profiles')
      .update({ is_active: newStatus })
      .eq('id', id)
      .eq('hospital_id', adminProfile?.hospital_id)
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    // Sync with role-specific tables
    if (profile.role === 'Doctor') {
      await (supabaseAdmin || supabase).from('doctors').update({ is_active: newStatus }).eq('user_id', id).eq('hospital_id', adminProfile?.hospital_id);
    } else if (profile.role === 'Receptionist') {
      await (supabaseAdmin || supabase).from('receptionists').update({ is_active: newStatus }).eq('user_id', id).eq('hospital_id', adminProfile?.hospital_id);
    } else if (profile.role === 'Admin') {
      await (supabaseAdmin || supabase).from('admins').update({ is_active: newStatus }).eq('user_id', id).eq('hospital_id', adminProfile?.hospital_id);
    }

    return NextResponse.json({
      message: `User ${profile.is_active ? 'activated' : 'deactivated'} successfully`,
      isActive: profile.is_active
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
