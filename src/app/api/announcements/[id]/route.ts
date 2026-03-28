import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get single announcement (Admin only)
// GET /api/announcements/:id
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { data: announcement, error } = await supabase
      .from('announcements')
      .select('*, profiles:created_by(name, email)')
      .eq('id', id)
      .single();

    if (error || !announcement) {
      return NextResponse.json({
        success: false,
        message: 'Announcement not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      announcement: {
        ...announcement,
        _id: announcement.id,
        createdBy: announcement.profiles
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Update announcement (Admin only)
// PUT /api/announcements/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const updateData = { ...body };
    delete updateData._id;
    
    // Map camelCase to snake_case if necessary
    if (updateData.startDate) { updateData.start_date = updateData.startDate; delete updateData.startDate; }
    if (updateData.endDate) { updateData.end_date = updateData.endDate; delete updateData.endDate; }
    if (updateData.targetAudience) { updateData.target_audience = updateData.targetAudience; delete updateData.targetAudience; }
    if (updateData.isActive !== undefined) { updateData.is_active = updateData.isActive; delete updateData.isActive; }

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select('*, profiles:created_by(name, email)')
      .single();

    if (error || !announcement) {
      return NextResponse.json({
        success: false,
        message: 'Announcement not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: {
        ...announcement,
        _id: announcement.id,
        createdBy: announcement.profiles
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Delete announcement (Admin only)
// DELETE /api/announcements/:id
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
