import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const body = await request.json();
    const { name, email, phone, subject, message, hospital_id } = body;

    if (!name || !email || !message || !hospital_id) {
      return NextResponse.json(
        { error: 'Name, email, message, and hospital_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('contact_messages')
      .insert([
        { name, email, phone, subject, message, hospital_id }
      ])
      .select()
      .single();

    if (error) {
      console.error('Contact submission error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'platform_admin']);
  if (authError) return authError;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase Admin client not initialized' }, { status: 500 });
  }

  let query = supabaseAdmin
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (profile.role !== 'platform_admin') {
    query = query.eq('hospital_id', profile.hospital_id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
