import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import axios from 'axios';

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const { reference, planType } = await request.json();

    if (!reference) {
      return NextResponse.json({ message: 'Transaction reference is required' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.warn('PAYSTACK_SECRET_KEY is not defined. Bypassing strict verification for development.');
    }

    let isSuccess = false;
    let amount = 0;
    let customerCode = 'dev_customer';
    let rawData = {};

    if (secretKey) {
      // Production verification
      const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      const data = paystackRes.data.data;
      
      if (data.status !== 'success') {
        return NextResponse.json({ message: 'Transaction was not totally successful from Paystack' }, { status: 400 });
      }

      isSuccess = true;
      amount = data.amount / 100;
      customerCode = data.customer?.customer_code || 'unknown';
      rawData = data;
    } else {
      // Mock success for development if keys aren't added yet
      isSuccess = true;
      amount = planType === 'yearly' ? 500000 : 50000;
      rawData = { mock: true, reference };
    }

    // Calculate new expiry date based on plan
    const daysToAdd = planType === 'yearly' ? 365 : 30;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);

    const client = supabaseAdmin || supabase;

    // Update Hospital Subscription
    const { error: updateError } = await client
      .from('hospitals')
      .update({
        subscription_status: 'active',
        subscription_plan: planType,
        next_billing_date: nextDate.toISOString(),
        paystack_customer_id: customerCode,
      })
      .eq('id', profile?.hospital_id);

    if (updateError) throw updateError;

    // Log the transaction
    await client.from('payment_transactions').insert([{
       hospital_id: profile?.hospital_id,
       reference: reference,
       amount: amount,
       plan: planType,
       status: 'success',
       metadata: rawData
    }]);

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription fully activated', 
      next_billing_date: nextDate 
    });
  } catch (error: any) {
    console.error('Billing Verification Error:', error.response?.data || error.message);
    return NextResponse.json({ message: 'Failed to verify transaction. Please contact support.' }, { status: 500 });
  }
}
