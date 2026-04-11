import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const { profile, error: authError } = await withAuth(request);
  if (authError) return authError;

  try {
    const { subscription, userId, hospitalId } = await request.json();

    const client = (supabaseAdmin || supabase);

    const { error } = await client
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        hospital_id: hospitalId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
