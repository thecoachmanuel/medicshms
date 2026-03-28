import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get all slot configs (Admin only)
// GET /api/slot-config/all
export async function GET(request: Request) {
  const { error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const { data: configs, error } = await supabase
      .from('slot_configs')
      .select('*, profiles:last_modified_by(name, email, phone)')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(configs.map(c => ({
      ...c,
      _id: c.id,
      lastModifiedBy: c.profiles
    })));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
