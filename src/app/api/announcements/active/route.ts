import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get all active announcements (public)
// GET /api/announcements/active
export async function GET() {
  try {
    const now = new Date().toISOString();
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*, profiles:created_by(name, email)')
      .eq('is_active', true)
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false })
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
