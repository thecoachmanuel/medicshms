import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Update service (Admin only)
// PUT /api/services/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const updateData = { ...body };
    delete updateData._id;
    if (updateData.department) {
      updateData.department_id = updateData.department;
      delete updateData.department;
    }

    const { data: service, error } = await (supabaseAdmin || supabase)
      .from('services')
      .update(updateData)
      .eq('id', id)
      .eq('hospital_id', profile?.hospital_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...service, _id: service.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

// DELETE service (Deactivate)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const { error } = await (supabaseAdmin || supabase)
      .from('services')
      .update({ is_active: false })
      .eq('id', id)
      .eq('hospital_id', profile?.hospital_id);

    if (error) throw error;

    return NextResponse.json({ message: 'Service deactivated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
