import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Lab Scientist', 'Admin', 'Doctor', 'Receptionist']);
  if (authError) return authError;

  try {
    const { data, error } = await (supabaseAdmin || supabase)
      .from('lab_units')
      .select('*')
      .eq('hospital_id', profile?.hospital_id)
      .order('name');

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Lab Scientist']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) return NextResponse.json({ message: 'Unit name is required' }, { status: 400 });

    const { data, error } = await (supabaseAdmin || supabase)
      .from('lab_units')
      .insert([{
        hospital_id: profile?.hospital_id,
        name,
        description
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Lab Scientist']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id) return NextResponse.json({ message: 'Unit ID is required' }, { status: 400 });

    const { data, error } = await (supabaseAdmin || supabase)
      .from('lab_units')
      .update({ name, description })
      .eq('id', id)
      .eq('hospital_id', profile?.hospital_id)
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

  if (!id) return NextResponse.json({ message: 'Unit ID is required' }, { status: 400 });

  try {
    const { error } = await (supabaseAdmin || supabase)
      .from('lab_units')
      .delete()
      .eq('id', id)
      .eq('hospital_id', profile?.hospital_id);

    if (error) throw error;
    return NextResponse.json({ message: 'Unit deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
