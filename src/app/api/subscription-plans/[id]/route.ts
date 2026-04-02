import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: authError } = await withAuth(request, ['Platform Admin']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { data: plan, error } = await client
      .from('subscription_plans')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Plan update error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: authError } = await withAuth(request, ['Platform Admin']);
  if (authError) return authError;

  try {
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { error } = await client
      .from('subscription_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error: any) {
    console.error('Plan deletion error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
