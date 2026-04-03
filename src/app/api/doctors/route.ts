import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { getFileUrl } from '@/lib/storageService';

// Get all active doctors (Public view or Dashboard)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalSlug = searchParams.get('hospitalSlug');
    const hospitalId = searchParams.get('hospitalId');

    // 1. Try to get hospital_id from auth (for dashboard)
    const { profile, supabase: supabaseClient } = await withAuth(request).catch(() => ({ profile: null, supabase: null }));
    const client = (supabaseAdmin || supabaseClient || supabase);
    let targetHospitalId = profile?.hospital_id || hospitalId;

    // 2. If no hospital_id but slug is provided (for public view)
    if (!targetHospitalId && hospitalSlug) {
      const { data: hosp } = await client
        .from('hospitals')
        .select('id')
        .eq('slug', hospitalSlug)
        .single();
      if (hosp) targetHospitalId = hosp.id;
    }

    if (!targetHospitalId) {
      return NextResponse.json({ data: [] });
    }

    const { data: doctors, error } = await client
      .from('doctors')
      .select('id, user_id, qualifications, experience, fees, profile_photo, profiles:user_id(name, email, phone), department:department_id(name, is_active)')
      .eq('hospital_id', targetHospitalId)
      .eq('is_active', true);

    const doctorsWithPhotos = await Promise.all(
      (doctors || [])
        .filter((doc: any) => !doc.department || doc.department.is_active)
        .map(async (doc) => {
          const profilePhotoUrl = doc.profile_photo ? getFileUrl(doc.profile_photo) : '';
        const profile = Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles;
        
        return {
          ...doc,
          _id: doc.id,
          profilePhotoUrl,
          user: {
            _id: doc.user_id,
            name: profile?.name,
            email: profile?.email,
            phone: profile?.phone
          }
        };
      })
    );

    return NextResponse.json({ data: doctorsWithPhotos });
  } catch (error: any) {
    console.error('[Doctors API Error]:', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Create doctor profile (Admin only)
export async function POST(request: Request) {
  const { profile, error: authError, supabase: supabaseClient } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  const client = (supabaseAdmin || supabaseClient);

  try {
    const { userId, department_id, qualifications, experience, fees, availableSlots } = await request.json();
    
    const { data: existingProfile } = await supabase.from('doctors').select('id').eq('user_id', userId).single();
    if (existingProfile) return NextResponse.json({ message: 'Doctor profile already exists' }, { status: 400 });

    const { data: doctor, error } = await (supabaseAdmin || supabase)
      .from('doctors')
      .insert([{
        user_id: userId,
        hospital_id: profile.hospital_id,
        department_id,
        qualifications,
        experience,
        fees,
        available_slots: availableSlots || []
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ ...doctor, _id: doctor.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
