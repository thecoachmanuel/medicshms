import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Pharmacist', 'Admin', 'Doctor']);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  try {
    let query = (supabaseAdmin || supabase)
      .from('pharmacy_inventory')
      .select('*')
      .eq('hospital_id', profile?.hospital_id)
      .order('item_name', { ascending: true });

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('item_name', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Pharmacist', 'Admin']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const insertData = { ...body, hospital_id: profile?.hospital_id };

    const { data, error } = await (supabaseAdmin || supabase)
      .from('pharmacy_inventory')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Pharmacist', 'Admin']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const { data, error } = await (supabaseAdmin || supabase)
      .from('pharmacy_inventory')
      .update(updateData)
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
