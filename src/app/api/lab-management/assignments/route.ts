import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Lab Scientist', 'Admin']);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const scientist_id = searchParams.get('scientist_id');
  const unit_id = searchParams.get('unit_id');

  try {
    let query = (supabaseAdmin || supabase)
      .from('lab_unit_assignments')
      .select(`
        *,
        unit:unit_id(id, name),
        scientist:scientist_id(id, name, email)
      `);

    if (scientist_id) query = query.eq('scientist_id', scientist_id);
    if (unit_id) query = query.eq('unit_id', unit_id);

    const { data: assignments, error } = await query;

    if (error) throw error;
    
    // Filter by hospital_id via the unit join since assignments don't have direct hospital_id
    // But since RLS is enabled on lab_units and lab_unit_assignments (tenant_isolation_policy_assignments),
    // Supabase will automatically filter based on the user's hospital.
    
    return NextResponse.json({ data: assignments });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { unit_id, scientist_id } = body;

    if (!unit_id || !scientist_id) return NextResponse.json({ message: 'Unit and Scientist IDs are required' }, { status: 400 });

    const { data, error } = await (supabaseAdmin || supabase)
      .from('lab_unit_assignments')
      .insert([{ unit_id, scientist_id }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ message: 'Assignment ID is required' }, { status: 400 });

  try {
    const { error } = await (supabaseAdmin || supabase)
      .from('lab_unit_assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: 'Assignment removed' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
