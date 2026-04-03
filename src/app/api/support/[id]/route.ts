import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { isPlatformAdmin } from '@/lib/auth-helpers';

// Get single ticket (Admin only)
// GET /api/support/:id
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin', 'Platform Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { data: ticket, error } = await (supabaseAdmin || supabase)
      .from('support_tickets')
      .select('*, profiles:resolved_by(name, email)')
      .eq('id', id)
      .single();

    if (error || !ticket) {
      return NextResponse.json({
        success: false,
        message: 'Ticket not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        _id: ticket.id,
        issueType: ticket.issue_type,
        resolvedBy: ticket.profiles
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Update ticket status (Admin only)
// PUT /api/support/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Platform Admin']) as any;
  if (authError) return authError;

  const { id } = await params;

  try {
    const { status, priority, notes } = await request.json();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (notes) updateData.notes = notes;

    if (status === 'Resolved' || status === 'Closed') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = profile?.id;
    }

    const { data: ticket, error } = await (supabaseAdmin || supabase)
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select('*, profiles:resolved_by(name, email)')
      .single();

    if (error || !ticket) {
      return NextResponse.json({
        success: false,
        message: 'Ticket not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: {
        ...ticket,
        _id: ticket.id,
        issueType: ticket.issue_type,
        resolvedBy: ticket.profiles
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Delete ticket (Admin only)
// DELETE /api/support/:id
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin', 'Platform Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { error } = await (supabaseAdmin || supabase)
      .from('support_tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
