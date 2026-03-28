import { NextResponse } from 'next/server';
import { paystack } from '@/lib/paystack';
import { withAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request);
  if (authError) return authError;

  try {
    const { amount, metadata = {} } = await request.json();
    
    if (!amount) {
      return NextResponse.json({ message: 'Amount is required' }, { status: 400 });
    }

    const finalMetadata = {
      ...metadata,
      hospital_id: profile.hospital_id || metadata.hospitalId,
      user_id: profile.id,
    };

    const result = await paystack.initializeTransaction(profile.email, amount, finalMetadata);

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
