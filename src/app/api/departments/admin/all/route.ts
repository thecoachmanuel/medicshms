import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { getFileUrl } from '@/lib/storageService';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    console.log('GET /api/departments/admin/all hit');
    const { data: departments, error } = await (supabaseAdmin || supabase)
      .from('departments')
      .select('*')
      .eq('hospital_id', profile?.hospital_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Fetch doctor counts for these departments
    const { data: doctorCounts } = await (supabaseAdmin || supabase)
      .from('doctors')
      .select('department_id')
      .eq('hospital_id', profile?.hospital_id);

    const countsMap = (doctorCounts || []).reduce((acc: any, doc: any) => {
      acc[doc.department_id] = (acc[doc.department_id] || 0) + 1;
      return acc;
    }, {});
    
    const departmentsWithBasicInfo = (departments || []).map((dept) => ({
      ...dept,
      _id: dept.id,
      doctorCount: countsMap[dept.id] || 0,
      imageUrl: dept.image ? getFileUrl(dept.image) : '',
      isActive: dept.is_active,
      defaultConsultationFee: dept.default_consultation_fee
    }));
    
    return NextResponse.json({ data: departmentsWithBasicInfo });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
