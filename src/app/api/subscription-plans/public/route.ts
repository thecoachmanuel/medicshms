import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { data: plans, error } = await client
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: plans });
  } catch (error: any) {
    console.error('Public plans fetch error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
