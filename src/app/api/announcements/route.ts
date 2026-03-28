import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get all announcements (Admin only)
// GET /api/announcements
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const { data: announcements, error } = await (supabaseAdmin || supabase)
      .from('announcements')
      .select('*, profiles:created_by(name, email)')
      .eq('hospital_id', profile?.hospital_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: announcements.length,
      announcements: announcements.map(a => ({
        ...a,
        _id: a.id,
        createdBy: a.profiles
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Create announcement (Admin only)
// POST /api/announcements
export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const { title, message, type, priority, startDate, endDate, targetAudience, icon } = await request.json();

    const { data: announcement, error } = await (supabaseAdmin || supabase)
      .from('announcements')
      .insert([{
        title,
        message,
        type,
        hospital_id: profile?.hospital_id,
        priority: priority || 0,
        start_date: startDate,
        end_date: endDate,
        target_audience: targetAudience,
        icon,
        created_by: profile?.id
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      announcement: { ...announcement, _id: announcement.id }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
