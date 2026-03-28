import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: authError } = await withAuth(request, ['platform_admin']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { status, subscription_status, trial_end_date } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (subscription_status) updateData.subscription_status = subscription_status;
    if (trial_end_date) updateData.trial_end_date = trial_end_date;
    
    updateData.updated_at = new Date().toISOString();

    const { data: hospital, error } = await client
      .from('hospitals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(hospital);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: authError } = await withAuth(request, ['platform_admin']);
  if (authError) return authError;

  try {
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { error } = await client
      .from('hospitals')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: 'Hospital deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
