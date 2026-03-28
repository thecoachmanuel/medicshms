import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get all active services (Public view or Dashboard)
// GET /api/services
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalSlug = searchParams.get('hospitalSlug');
    const hospitalId = searchParams.get('hospitalId');

    // 1. Try to get hospital_id from auth (for dashboard)
    const { profile } = await withAuth(request).catch(() => ({ profile: null }));
    let targetHospitalId = profile?.hospital_id || hospitalId;

    // 2. If no hospital_id but slug is provided (for public view)
    if (!targetHospitalId && hospitalSlug) {
      const { data: hosp } = await (supabaseAdmin || supabase)
        .from('hospitals')
        .select('id')
        .eq('slug', hospitalSlug)
        .single();
      if (hosp) targetHospitalId = hosp.id;
    }

    if (!targetHospitalId) {
      return NextResponse.json({ data: [] });
    }

    const { data: services, error } = await (supabaseAdmin || supabase)
      .from('services')
      .select('*, departments(name, is_active)')
      .eq('hospital_id', targetHospitalId)
      .eq('is_active', true);

    const filteredServices = (services || []).filter((s: any) => !s.departments || s.departments.is_active);

    return NextResponse.json(filteredServices.map(s => ({
      ...s,
      _id: s.id,
      department: s.departments
    })));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Create service (Admin only)
// POST /api/services
export async function POST(request: Request) {
  const { profile, error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const { name, description, department, price } = await request.json();
    const { data: service, error } = await (supabaseAdmin || supabase)
      .from('services')
      .insert([{
        name,
        description,
        hospital_id: profile.hospital_id,
        department_id: department,
        price
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...service, _id: service.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
