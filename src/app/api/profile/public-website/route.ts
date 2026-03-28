import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { buildProfileResponse } from '@/lib/profile';

// PUT /api/profile/public-website (Doctor only)
export async function PUT(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Doctor']);
  if (authError) return authError;

  try {
    const { shortBio, detailedBiography, specialInterests, featuredTreatments, patientTestimonials } = await request.json();
    
    const doctorUpdate: any = {};
    if (shortBio !== undefined) doctorUpdate.short_bio = shortBio;
    if (detailedBiography !== undefined) doctorUpdate.detailed_biography = detailedBiography;
    if (specialInterests !== undefined) doctorUpdate.special_interests = specialInterests;
    if (featuredTreatments !== undefined) doctorUpdate.featured_treatments = featuredTreatments;
    if (patientTestimonials !== undefined) doctorUpdate.patient_testimonials = patientTestimonials;

    const { error } = await supabase
      .from('doctors')
      .update(doctorUpdate)
      .eq('user_id', userProfile.id);

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    const updatedProfile = await buildProfileResponse(userProfile.id);
    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
