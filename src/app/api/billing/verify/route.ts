import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import axios from 'axios';

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const { reference, planId, cycle } = await request.json();

    if (!reference || !planId || !cycle) {
      return NextResponse.json({ message: 'Reference, Plan ID, and Cycle are required' }, { status: 400 });
    }

    const client = supabaseAdmin || supabase;
    if (!client) throw new Error('Supabase client failure');

    // 0. Fetch the Plan Details
    const { data: plan, error: planError } = await client
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ message: 'Invalid subscription plan selected' }, { status: 404 });
    }

    const expectedPrice = cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    
    // 1. Fetch current Hospital data for additive logic
    const { data: hospital, error: hospError } = await client
      .from('hospitals')
      .select('next_billing_date, trial_end_date, subscription_status')
      .eq('id', profile?.hospital_id)
      .single();

    if (hospError || !hospital) {
      return NextResponse.json({ message: 'Hospital profile not found' }, { status: 404 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    let isSuccess = false;
    let amountPaid = 0;
    let customerCode = 'dev_customer';
    let rawData = {};

    if (secretKey) {
      // Production verification
      const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      const data = paystackRes.data.data;
      
      if (data.status !== 'success') {
        return NextResponse.json({ message: 'Transaction was not successful from Paystack' }, { status: 400 });
      }

      // Verify Amount (Paystack amount is in Kobo)
      amountPaid = data.amount / 100;
      if (amountPaid < expectedPrice) {
        return NextResponse.json({ message: `Insufficient payment: Expected ₦${expectedPrice}` }, { status: 400 });
      }

      isSuccess = true;
      customerCode = data.customer?.customer_code || 'unknown';
      rawData = data;
    } else {
      // Mock success for development
      isSuccess = true;
      amountPaid = expectedPrice;
      rawData = { mock: true, reference };
    }

    // 2. Additive Extension Logic
    // Current end date: next_billing_date is our source of truth, fallback to trial_end_date
    const currentExpiryStr = hospital.next_billing_date || hospital.trial_end_date;
    const currentExpiry = currentExpiryStr ? new Date(currentExpiryStr) : new Date();
    const now = new Date();

    // If already expired, start from now. If active, add to existing time.
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const daysToAdd = cycle === 'yearly' ? 365 : 30;
    
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + daysToAdd);

    // 3. Update Hospital Subscription
    const { error: updateError } = await client
      .from('hospitals')
      .update({
        subscription_status: 'active',
        plan_id: planId,
        billing_cycle: cycle,
        next_billing_date: nextDate.toISOString(),
        paystack_customer_id: customerCode,
      })
      .eq('id', profile?.hospital_id);

    if (updateError) throw updateError;

    // 4. Log the transaction
    await client.from('payment_transactions').insert([{
       hospital_id: profile?.hospital_id,
       reference: reference,
       amount: amountPaid,
       plan: `${plan.name} (${cycle})`,
       status: 'success',
       metadata: rawData
    }]);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully subscribed to ${plan.name}`, 
      next_billing_date: nextDate 
    });
  } catch (error: any) {
    console.error('Billing Verification Error:', error.response?.data || error.message);
    return NextResponse.json({ message: 'Failed to verify transaction. Please contact support.' }, { status: 500 });
  }
}
