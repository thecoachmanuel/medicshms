import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get doctor profile & public content for dashboard (Doctor only)
// GET /api/doctor-dashboard/profile
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Doctor']);
  if (authError) return authError;

  try {
    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('*, profiles!inner(*), departments(*), additional_departments:departments(*)')
      .eq('user_id', profile?.id)
      .single();

    if (error || !doctor) return NextResponse.json({ message: 'Doctor profile not found' }, { status: 404 });

    return NextResponse.json({
      _id: doctor.id,
      name: doctor.profiles?.name || '',
      email: doctor.profiles?.email || '',
      phone: doctor.profiles?.phone || '',
      department: doctor.departments,
      departments: doctor.additional_departments || [],
      qualifications: doctor.qualifications || '',
      experience: doctor.experience || 0,
      fees: doctor.fees || 0,
      gender: doctor.gender || '',
      medicalCouncilId: doctor.medical_council_id || '',
      profilePhoto: doctor.profile_photo || '',
      digitalSignature: doctor.digital_signature || '',
      shortBio: doctor.short_bio || '',
      detailedBiography: doctor.detailed_biography || '',
      specialInterests: doctor.special_interests || [],
      featuredTreatments: doctor.featured_treatments || [],
      patientTestimonials: doctor.patient_testimonials || [],
      availableSlots: doctor.available_slots || [],
      isActive: doctor.is_active,
    });
  } catch (error: any) {
    console.error('Doctor profile error:', error);
    return NextResponse.json({ message: 'Failed to fetch doctor profile' }, { status: 500 });
  }
}
