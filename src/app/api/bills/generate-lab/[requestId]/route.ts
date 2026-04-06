import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { BillingService } from '@/lib/billing-service';

// Generate a bill for a specific Lab Request ID
// POST /api/bills/generate-lab/[requestId]
export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Admin', 'Lab Scientist', 'Receptionist', 'Doctor', 'Radiologist', 'Pharmacist', 'Clinical Scientist']);
  if (authError) return authError;

  const { requestId } = await params;

  try {
    const client = (supabaseAdmin || supabase);

    // 1. Fetch the lab request details
    const { data: labRequest, error: fetchError } = await client
      .from('clinical_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !labRequest) {
      return NextResponse.json({ success: false, message: 'Lab request not found' }, { status: 404 });
    }

    const bill = await BillingService.generateAutoInvoice({
      hospitalId: userProfile?.hospital_id,
      patientId: labRequest.patient_id,
      sourceType: 'Laboratory',
      sourceId: requestId,
      userProfile,
      services: [{
        id: labRequest.service_id || 'manual',
        name: labRequest.test_name || 'Laboratory Test',
        price: Number(labRequest.test_price || 0),
        quantity: 1,
        total: Number(labRequest.test_price || 0)
      }]
    });

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
