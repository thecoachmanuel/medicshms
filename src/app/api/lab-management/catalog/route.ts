import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Lab Scientist', 'Doctor', 'Admin', 'Receptionist']);
  if (authError) return authError;

  try {
    const { data, error } = await (supabaseAdmin || supabase)
      .from('lab_test_catalog')
      .select(`
        *,
        unit:unit_id(name)
      `)
      .eq('hospital_id', profile?.hospital_id)
      .order('test_name');

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Lab Scientist', 'Admin', 'Doctor']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { test_name, price, unit_id, description, is_auto_created } = body;

    if (!test_name) return NextResponse.json({ message: 'Test name is required' }, { status: 400 });

    const upsertData: any = {
      hospital_id: profile?.hospital_id,
      test_name,
      price: price || 0,
      unit_id: unit_id || null,
      description: description || null,
      is_auto_created: is_auto_created || false,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await (supabaseAdmin || supabase)
      .from('lab_test_catalog')
      .upsert(upsertData, { 
        onConflict: 'hospital_id, test_name',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
