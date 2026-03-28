import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { data: dept } = await (supabaseAdmin || supabase)
      .from('departments')
      .select('is_active')
      .eq('id', id)
      .eq('hospital_id', profile?.hospital_id)
      .single();
    if (!dept) return NextResponse.json({ message: 'Department not found' }, { status: 404 });

    const { data: updatedDept, error } = await (supabaseAdmin || supabase)
      .from('departments')
      .update({ is_active: !dept.is_active })
      .eq('id', id)
      .eq('hospital_id', profile?.hospital_id)
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json({ 
      message: `Department ${updatedDept.is_active ? 'activated' : 'deactivated'} successfully`,
      isActive: updatedDept.is_active
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
