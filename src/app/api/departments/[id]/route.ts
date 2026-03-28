import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { getFileUrl, uploadFile, deleteFile } from '@/lib/storageService';
import slugify from 'slugify';

// GET single department
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: department, error } = await (supabaseAdmin || supabase)
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !department) return NextResponse.json({ message: 'Department not found' }, { status: 404 });

    const { data: doctors } = await (supabaseAdmin || supabase)
      .from('doctors')
      .select('*, profiles(name, email, phone)')
      .eq('hospital_id', department.hospital_id)
      .or(`department_id.eq.${department.id},additional_department_ids.cs.{${department.id}}`);

    const doctorsWithPhotos = await Promise.all(
      (doctors || []).map(async (doc) => {
        const profilePhotoUrl = doc.profile_photo ? getFileUrl(doc.profile_photo) : '';
        return {
          ...doc,
          _id: doc.id,
          profilePhotoUrl,
          user: {
            _id: doc.user_id,
            name: doc.profiles.name,
            email: doc.profiles.email,
            phone: doc.profiles.phone
          }
        };
      })
    );

    const imageUrl = department.image ? getFileUrl(department.image) : '';

    return NextResponse.json({
      ...department,
      _id: department.id,
      imageUrl,
      imageKey: department.image || '',
      isActive: department.is_active,
      defaultConsultationFee: department.default_consultation_fee,
      doctors: doctorsWithPhotos
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT update department
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const { id } = await params;

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const defaultConsultationFee = formData.get('defaultConsultationFee') as string;
    const services = formData.get('services') as string;
    const contact = formData.get('contact') as string;
    const isActive = formData.get('isActive') as string;
    const image = formData.get('image') as File | null;

    const { data: department, error: deptError } = await (supabaseAdmin || supabase)
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (deptError || !department) return NextResponse.json({ message: 'Department not found' }, { status: 404 });

    // Verify hospital_id
    const { profile } = await withAuth(request, ['Admin']);
    if (department.hospital_id !== profile?.hospital_id) {
      return NextResponse.json({ message: 'Forbidden: Cross-tenant access' }, { status: 403 });
    }

    const updateData: any = {};
    if (name) {
      updateData.name = name;
      const slug = slugify(name, { lower: true, strict: true });
      
      // Check if this slug is taken by another department in THE SAME hospital
      const { data: existing } = await (supabaseAdmin || supabase)
        .from('departments')
        .select('id')
        .eq('slug', slug)
        .eq('hospital_id', profile?.hospital_id)
        .neq('id', id)
        .maybeSingle();
        
      if (existing) {
        return NextResponse.json({ message: 'A department with this name already exists' }, { status: 400 });
      }
      
      updateData.slug = slug;
    }
    if (description !== null) updateData.description = description;
    if (defaultConsultationFee !== null) updateData.default_consultation_fee = parseFloat(defaultConsultationFee);
    if (services !== null) updateData.services = JSON.parse(services);
    if (contact !== null) updateData.contact = JSON.parse(contact);
    if (isActive !== null) updateData.is_active = isActive === 'true' || isActive === '1';

    if (image) {
      if (department.image) await deleteFile(department.image);
      const buffer = Buffer.from(await image.arrayBuffer());
      const base64Image = `data:${image.type};base64,${buffer.toString('base64')}`;
      const uploadResult = await uploadFile(base64Image, 'departments');
      updateData.image = uploadResult.public_id;
    }

    const { data: updatedDept, error } = await (supabaseAdmin || supabase)
      .from('departments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    return NextResponse.json({ ...updatedDept, _id: updatedDept.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE department
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile } = await withAuth(request, ['Admin']);
  const { id } = await params;

  try {
    const { count } = await (supabaseAdmin || supabase)
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', profile?.hospital_id)
      .or(`department_id.eq.${id},additional_department_ids.cs.{${id}}`);

    if ((count || 0) > 0) {
      return NextResponse.json({ message: 'Cannot delete department with associated doctors' }, { status: 400 });
    }

    const { data: dept } = await (supabaseAdmin || supabase).from('departments').select('image, hospital_id').eq('id', id).single();
    if (!dept) return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    if (dept.hospital_id !== profile?.hospital_id) {
       return NextResponse.json({ message: 'Forbidden: Cross-tenant access' }, { status: 403 });
    }

    if (dept.image) await deleteFile(dept.image);

    const { error } = await (supabaseAdmin || supabase).from('departments').delete().eq('id', id);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
