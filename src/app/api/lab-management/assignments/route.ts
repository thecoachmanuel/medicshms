import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile, supabase: supabaseClient } = await withAuth(request, ['Lab Scientist', 'Admin', 'Doctor']);
  if (authError || !supabaseClient) return authError;

  const { searchParams } = new URL(request.url);
  const scientist_id = searchParams.get('scientist_id') || searchParams.get('scientistId');
  const unit_id = searchParams.get('unit_id') || searchParams.get('unitId');

  try {
    let query = supabaseClient
      .from('lab_unit_assignments')
      .select(`
        *,
        unit:lab_units!unit_id(id, name),
        scientist:profiles!scientist_id(id, name, email)
      `);

    if (scientist_id) query = query.eq('scientist_id', scientist_id);
    if (unit_id) query = query.eq('unit_id', unit_id);

    const { data: assignments, error } = await query;

    if (error) {
      console.error('❌ Assignments API Error:', error);
      throw error;
    }
    
    return NextResponse.json({ data: assignments });
  } catch (error: any) {
    console.error('💥 Assignments API Crash:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError, profile, supabase: supabaseClient } = await withAuth(request, ['Admin']);
  if (authError || !supabaseClient) return authError;

  try {
    const body = await request.json();
    const { unit_id, scientist_id } = body;

    if (!unit_id || !scientist_id) return NextResponse.json({ message: 'Unit and Scientist IDs are required' }, { status: 400 });

    const { data, error } = await supabaseClient
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
  const { error: authError, profile, supabase: supabaseClient } = await withAuth(request, ['Admin']);
  if (authError || !supabaseClient) return authError;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ message: 'Assignment ID is required' }, { status: 400 });

  try {
    const { error } = await supabaseClient
      .from('lab_unit_assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: 'Assignment removed' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
