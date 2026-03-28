import { NextResponse } from 'next/server';
import { paystack } from '@/lib/paystack';
import { withAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request);
  if (authError) return authError;

  try {
    const { plan } = await request.json();
    
    // Define amounts (in Naira, will be converted to kobo in lib/paystack)
    const amounts: Record<string, number> = {
      pro: 99.00, // Example monthly price
      yearly: 990.00,
    };

    const amount = amounts[plan] || 99.00;

    const metadata = {
      hospital_id: profile.hospital_id,
      user_id: profile.id,
      plan_type: plan,
    };

    const result = await paystack.initializeTransaction(profile.email, amount, metadata);

    if (result.status) {
      return NextResponse.json(result.data);
    } else {
      throw new Error(result.message);
    }
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
