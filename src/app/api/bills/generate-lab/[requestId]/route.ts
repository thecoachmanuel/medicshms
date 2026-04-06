import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Generate a bill for a specific Lab Request ID
// POST /api/bills/generate-lab/[requestId]
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Admin', 'Lab Scientist', 'Receptionist']);
  if (authError) return authError;

  const { requestId } = await params;

  try {
    const client = (supabaseAdmin || supabase);

    // 1. Fetch the lab request details
    const { data: labRequest, error: fetchError } = await client
      .from('clinical_requests')
      .select('*, patient:patient_id(*)')
      .eq('id', requestId)
      .single();

    if (fetchError || !labRequest) {
      return NextResponse.json({ success: false, message: 'Lab request not found' }, { status: 404 });
    }

    // 2. Determine the price (test_price from request, or default to 0)
    const price = Number(labRequest.test_price || 0);
    const testName = labRequest.test_name || 'Laboratory Test';

    // 3. Generate a unique bill number
    const billNumber = `INV-LAB-${Date.now().toString().slice(-6)}`;

    // 4. Create the bill record
    // We categorize it as an isolated bill for that test
    const services = [
      {
        id: labRequest.service_id || 'manual',
        name: testName,
        price: price,
        quantity: 1,
        total: price
      }
    ];

    const { data: bill, error: createError } = await client
      .from('bills')
      .insert([{
        hospital_id: userProfile?.hospital_id,
        patient_id: labRequest.patient_id,
        bill_number: billNumber,
        services,
        subtotal: price,
        discount: 0,
        round_off: 0,
        total_amount: price,
        paid_amount: 0,
        due_amount: price,
        payment_status: 'Pending',
        payment_method: 'Pending',
        notes: `Bill generated for lab request: ${testName}`,
        generated_by: {
          name: userProfile?.name,
          role: userProfile?.role
        }
      }])
      .select()
      .single();

    if (createError) throw createError;

    // 5. Update the lab request with the bill reference (if we have a col) 
    // or just mark as Billed
    await client
      .from('clinical_requests')
      .update({ 
        payment_status: 'Billed',
        bill_id: bill.id 
      })
      .eq('id', requestId);

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice generated successfully',
      billId: bill.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Lab billing generation error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
