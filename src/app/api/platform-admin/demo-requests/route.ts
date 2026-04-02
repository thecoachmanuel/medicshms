import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError } = await withAuth(request, ['Platform Admin']);
  if (authError) return authError;

  try {
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { data, error } = await client
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Demo requests fetch error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { error: authError } = await withAuth(request, ['Platform Admin']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { data, error } = await client
      .from('demo_requests')
      .update(body)
      .eq('id', body.id) // Fallback to body.id if params.id is tricky in next versions
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Demo request update error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
