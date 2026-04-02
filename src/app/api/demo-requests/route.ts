import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    const { data, error } = await client
      .from('demo_requests')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    // Send notification to platform admin
    const { error: notifError } = await client
      .from('notifications')
      .insert([{
        title: 'New Demo Request',
        message: `A new demo request has been received from ${body.hospital_name}.`,
        type: 'subscription', // Using existing type
        role: 'Platform Admin'
      }]);

    if (notifError) console.error('Failed to send demo notification:', notifError);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Demo request submission error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
