import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get activity feed (Admin, Receptionist, Doctor)
// GET /api/dashboard/activity
export async function GET(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor']);
  if (authError) return authError;

  try {
    const [
      { data: appointments },
      { data: bills },
      { data: tickets },
      { data: announcements }
    ] = await Promise.all([
      (supabaseAdmin || supabase).from('public_appointments').select('full_name, appointment_status, appointment_id, created_at, department').eq('hospital_id', userProfile?.hospital_id).order('created_at', { ascending: false }).limit(5),
      (supabaseAdmin || supabase).from('bills').select('bill_number, total_amount, payment_status, created_at').eq('hospital_id', userProfile?.hospital_id).order('created_at', { ascending: false }).limit(5),
      (supabaseAdmin || supabase).from('support_tickets').select('name, issue_type, status, created_at').eq('hospital_id', userProfile?.hospital_id).order('created_at', { ascending: false }).limit(3),
      (supabaseAdmin || supabase).from('announcements').select('title, type, priority, created_at').eq('hospital_id', userProfile?.hospital_id).order('created_at', { ascending: false }).limit(3)
    ]);

    const feed: any[] = [];
    (appointments || []).forEach(a => feed.push({ type: 'appointment', title: `New appointment ${a.appointment_id}`, description: `${a.full_name} — ${a.department || 'General'}`, status: a.appointment_status, time: a.created_at }));
    (bills || []).forEach(b => feed.push({ type: 'bill', title: `Invoice ${b.bill_number}`, description: `₹${Number(b.total_amount).toLocaleString('en-IN')} — ${b.payment_status}`, status: b.payment_status, time: b.created_at }));
    (tickets || []).forEach(t => feed.push({ type: 'support', title: `Ticket: ${t.issue_type}`, description: `From ${t.name} — ${t.status}`, status: t.status, time: t.created_at }));
    (announcements || []).forEach(a => feed.push({ type: 'announcement', title: a.title, description: `${a.type} — ${a.priority} priority`, status: a.type, time: a.created_at }));

    feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return NextResponse.json(feed.slice(0, 15));
  } catch (error: any) {
    console.error('Activity feed error:', error);
    return NextResponse.json({ message: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
