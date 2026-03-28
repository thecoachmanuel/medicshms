import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth, getAuthUser } from '@/lib/auth';

// Create a new support ticket
// POST /api/support
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, issueType, description, ticket_type, hospital_id: bodyHospitalId } = body;

    // 1. Try to get authenticated user (Tenant Admin)
    const profile = await getAuthUser(request);
    
    // 2. Resolve hospital_id
    // If authenticated, use their hospital_id. If not (public), use from body.
    let hospital_id = profile?.hospital_id || bodyHospitalId;

    // Fallback: If still missing, try to resolve from slug if available
    if (!hospital_id && body.slug) {
      const { data: hosp } = await (supabaseAdmin || supabase)
        .from('hospitals')
        .select('id')
        .eq('slug', body.slug)
        .single();
      if (hosp) hospital_id = hosp.id;
    }

    if (!hospital_id) {
      console.error('Support creation failed: hospital_id missing');
      return NextResponse.json({
        success: false,
        message: 'hospital_id is required'
      }, { status: 400 });
    }

    // 3. Use supabaseAdmin to bypass RLS for insertion
    const { data: ticket, error } = await (supabaseAdmin || supabase)
      .from('support_tickets')
      .insert([{
        name,
        email,
        phone,
        issue_type: issueType,
        description,
        ticket_type: ticket_type || 'patient',
        hospital_id
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: { ...ticket, _id: ticket.id }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Support creation error:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Get all support tickets (Admin only)
// GET /api/support
export async function GET(request: Request) {
  const { error: authError } = await withAuth(request, ['Admin', 'platform_admin']);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const issueType = searchParams.get('issueType');
  const ticketType = searchParams.get('ticket_type');

  try {
    const { profile } = await withAuth(request, ['Admin', 'platform_admin']) as any;
    
    let query = (supabaseAdmin || supabase)
      .from('support_tickets')
      .select('*, profiles:resolved_by(name, email)')
      .order('created_at', { ascending: false });

    // Platform admin sees everything, hospital admin only sees their own
    if (profile.role !== 'platform_admin') {
      query = query.eq('hospital_id', profile.hospital_id);
    }

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (issueType) query = query.eq('issue_type', issueType);
    if (ticketType) query = query.eq('ticket_type', ticketType);

    const { data: tickets, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: tickets.length,
      tickets: tickets.map(t => ({
        ...t,
        _id: t.id,
        issueType: t.issue_type,
        resolvedBy: t.profiles
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
