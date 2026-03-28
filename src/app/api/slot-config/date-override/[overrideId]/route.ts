import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Remove date override (Receptionist/Admin)
// DELETE /api/slot-config/date-override/:overrideId
export async function DELETE(request: Request, { params }: { params: Promise<{ overrideId: string }> }) {
  const { error: authError, profile } = await withAuth(request, ['Receptionist', 'Admin']);
  if (authError) return authError;

  const { overrideId } = await params;

  try {
    const { data: config, error: fetchError } = await supabase
      .from('slot_configs')
      .select('*')
      .eq('key', 'shared')
      .single();

    if (fetchError || !config) return NextResponse.json({ message: 'Slot config not found' }, { status: 404 });

    const overrides = config.date_overrides.filter((o: any) => o.id !== overrideId && o._id !== overrideId);

    const { data: updated, error: updateError } = await supabase
      .from('slot_configs')
      .update({ 
        date_overrides: overrides, 
        last_modified_by: profile?.id 
      })
      .eq('id', config.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ ...updated, _id: updated.id, dateOverrides: updated.date_overrides });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
