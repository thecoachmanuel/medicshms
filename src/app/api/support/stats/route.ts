import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get support ticket statistics (Admin only)
// GET /api/support/stats
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const [
      { count: total },
      { count: open },
      { count: inProgress },
      { count: resolved },
      { count: closed },
      { data: tickets }
    ] = await Promise.all([
      (supabaseAdmin || supabase).from('support_tickets').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id),
      (supabaseAdmin || supabase).from('support_tickets').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('status', 'Open'),
      (supabaseAdmin || supabase).from('support_tickets').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('status', 'In Progress'),
      (supabaseAdmin || supabase).from('support_tickets').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('status', 'Resolved'),
      (supabaseAdmin || supabase).from('support_tickets').select('*', { count: 'exact', head: true }).eq('hospital_id', profile?.hospital_id).eq('status', 'Closed'),
      (supabaseAdmin || supabase).from('support_tickets').select('issue_type').eq('hospital_id', profile?.hospital_id)
    ]);

    const counts = (tickets || []).reduce((acc: any, curr: any) => {
      acc[curr.issue_type] = (acc[curr.issue_type] || 0) + 1;
      return acc;
    }, {});

    const issueTypeStats = Object.entries(counts).map(([_id, count]) => ({ _id, count }));

    return NextResponse.json({
      success: true,
      stats: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        byIssueType: issueTypeStats
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
