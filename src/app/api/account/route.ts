import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    // 1. Fetch Revenue Data from bills
    const { data: bills, error: billsError } = await (supabaseAdmin || supabase)
      .from('bills')
      .select('total_amount, payment_status, created_at')
      .eq('hospital_id', hospital_id);

    if (billsError) throw billsError;

    // 2. Fetch Hospital Subscription Info
    const { data: hospital, error: hospError } = await (supabaseAdmin || supabase)
      .from('hospitals')
      .select('subscription_status, next_billing_date, subscription_plan, trial_end_date')
      .eq('id', hospital_id)
      .single();

    if (hospError) throw hospError;

    // Aggregate Revenue
    const totalRevenue = bills?.filter(b => b.payment_status === 'Paid').reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
    const pendingRevenue = bills?.filter(b => b.payment_status === 'Pending' || b.payment_status === 'Partial').reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
    const invoiceCount = bills?.length || 0;

    // Quarterly Growth (Mock logic based on current data)
    // In a real app, we'd compare periods.
    const revenueStats = {
      totalRevenue,
      pendingRevenue,
      invoiceCount,
      growthRate: 15, // Mock percentage
    };

    // 3. Recent Transactions
    const { data: recentTransactions } = await (supabaseAdmin || supabase)
      .from('bills')
      .select('id, total_amount, payment_status, created_at, patient_id')
      .eq('hospital_id', hospital_id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({ 
      data: {
        revenueStats, 
        hospital,
        recentTransactions: recentTransactions?.map(tx => ({
           ...tx,
           amount: tx.total_amount,
           status: tx.payment_status
        })) || []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
