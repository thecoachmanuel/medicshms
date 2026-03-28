import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { getFileUrl, uploadFile } from '@/lib/storageService';
import slugify from 'slugify';

// Get all active departments (Public view or Dashboard)
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
      return NextResponse.json({ data: [] }); // Or error if hospital context is required
    }

    const { data: departments, error } = await (supabaseAdmin || supabase)
      .from('departments')
      .select('id, name, slug, description, image, is_active, default_consultation_fee, contact')
      .eq('hospital_id', targetHospitalId)
      .eq('is_active', true)
      .order('name');

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    // Fetch doctor counts for these departments
    const { data: doctorCounts } = await (supabaseAdmin || supabase)
      .from('doctors')
      .select('department_id')
      .eq('hospital_id', targetHospitalId)
      .eq('is_active', true);

    const countsMap = (doctorCounts || []).reduce((acc: any, doc: any) => {
      acc[doc.department_id] = (acc[doc.department_id] || 0) + 1;
      return acc;
    }, {});

    const departmentsWithExtras = await Promise.all(
      (departments || []).map(async (dept) => {
        const imageUrl = dept.image ? getFileUrl(dept.image) : '';
        return { 
          ...dept, 
          _id: dept.id, 
          imageUrl,
          defaultConsultationFee: dept.default_consultation_fee,
          isActive: dept.is_active,
          doctorCount: countsMap[dept.id] || 0
        };
      })
    );

    return NextResponse.json({ data: departmentsWithExtras });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Create department (Admin only)
export async function POST(request: Request) {
  const { profile, error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const defaultConsultationFee = formData.get('defaultConsultationFee') as string;
    const services = formData.get('services') as string;
    const contact = formData.get('contact') as string;
    const image = formData.get('image') as File | null;

    const slug = slugify(name, { lower: true, strict: true });

    // Check for existing slug
    const { data: existing } = await (supabaseAdmin || supabase)
      .from('departments')
      .select('id')
      .eq('hospital_id', profile.hospital_id)
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'A department with this name already exists' }, { status: 400 });
    }

    const insertData: any = {
      name,
      slug,
      description,
      hospital_id: profile.hospital_id,
      default_consultation_fee: defaultConsultationFee ? parseFloat(defaultConsultationFee) : 0,
      services: services ? JSON.parse(services) : [],
      contact: contact ? JSON.parse(contact) : {}
    };

    if (image) {
      // For now, assume uploadFile handles the File object or convert to base64
      // Simplified: use base64 for Cloudinary if needed, or handle File buffer
      const buffer = Buffer.from(await image.arrayBuffer());
      const base64Image = `data:${image.type};base64,${buffer.toString('base64')}`;
      const uploadResult = await uploadFile(base64Image, 'departments');
      insertData.image = uploadResult.public_id;
    }

    const { data: department, error } = await (supabaseAdmin || supabase)
      .from('departments')
      .insert([insertData])
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    return NextResponse.json({ ...department, _id: department.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
