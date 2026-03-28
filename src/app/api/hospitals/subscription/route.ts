import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const { error: authError, user } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { planId, cycle, hospitalId } = body;
    
    const client = supabaseAdmin;
    if (!client) throw new Error('Supabase Admin client not initialized');

    // 1. Get Plan details
    const { data: plan, error: planError } = await client
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) throw planError;

    // 2. Get Current Hospital status
    const { data: hospital, error: hospError } = await client
      .from('hospitals')
      .select('subscription_end_date, subscription_status')
      .eq('id', hospitalId)
      .single();

    if (hospError) throw hospError;

    // 3. Calculate new end date
    const daysToAdd = cycle === 'yearly' ? 365 : 30;
    let startDate = new Date();
    
    // If subscription is still active, stack it
    if (hospital.subscription_end_date && new Date(hospital.subscription_end_date) > new Date()) {
      startDate = new Date(hospital.subscription_end_date);
    }

    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + daysToAdd);

    // 4. Update Hospital
    const { error: updateError } = await client
      .from('hospitals')
      .update({
        subscription_status: 'active',
        subscription_end_date: newEndDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', hospitalId);

    if (updateError) throw updateError;

    // 5. AUTO-APPLY PAYMENT FEATURES
    // Update site settings to enable payment options automatically
    const { error: settingsError } = await client
      .from('site_settings')
      .update({
        is_payment_enabled: true, // Assuming this column exists or we add it
        updated_at: new Date().toISOString()
      })
      .eq('hospital_id', hospitalId);

    if (settingsError) {
      console.warn('Failed to auto-enable payment features:', settingsError);
      // Don't fail the whole request because of this
    }

    return NextResponse.json({ 
      message: 'Subscription updated successfully',
      newEndDate: newEndDate.toISOString()
    });
  } catch (error: any) {
    console.error('Subscription update error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
