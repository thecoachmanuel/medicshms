import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'platform_admin']);
  if (authError) return authError;

  try {
    const client = supabaseAdmin || supabase;
    let query = client
      .from('payment_transactions')
      .select('*')
      .order('paid_at', { ascending: false });

    // Restrict isolation if not a platform admin
    if (profile.role !== 'platform_admin') {
      query = query.eq('hospital_id', profile.hospital_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
