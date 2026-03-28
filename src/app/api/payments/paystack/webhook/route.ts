import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ message: 'No signature' }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
      const { metadata, amount } = event.data;
      const { hospital_id, plan_type } = metadata;

      // Calculate new end date (e.g., +30 days)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const client = supabaseAdmin;
      if (!client) throw new Error('Supabase Admin client not initialized');

      const { error } = await client
        .from('hospitals')
        .update({
          subscription_status: 'active',
          subscription_end_date: endDate.toISOString(),
          status: 'active'
        })
        .eq('id', hospital_id);

      if (error) throw error;
      
      console.log(`Successfully updated subscription for hospital ${hospital_id}`);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
