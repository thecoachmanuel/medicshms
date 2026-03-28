import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError } = await withAuth(request, ['platform_admin']);
  if (authError) return authError;

  try {
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { data: plans, error } = await client
      .from('subscription_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: plans });
  } catch (error: any) {
    console.error('Plans fetch error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError } = await withAuth(request, ['platform_admin']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { data: plan, error } = await client
      .from('subscription_plans')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Plan creation error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
