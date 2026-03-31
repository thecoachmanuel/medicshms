import { supabase, supabaseAdmin } from './supabase';

/**
 * Build a full profile response with role-specific data
 * @param userId - The user ID from profiles table
 * @returns Combined profile object or null
 */
export async function buildProfileResponse(userId: string) {
  // 1. Get base profile
  const { data: profile, error: profileError } = await (supabaseAdmin || supabase)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) return null;

  const profileData: any = {
    _id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    hospital_id: profile.hospital_id,
    isActive: profile.is_active,
    lastLogin: profile.last_login,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at
  };

  // 1.5 Get hospital info if available
  if (profile.hospital_id) {
    const { data: hospital } = await (supabaseAdmin || supabase)
      .from('hospitals')
      .select('slug, subscription_status, trial_end_date')
      .eq('id', profile.hospital_id)
      .single();
    
    if (hospital) {
      profileData.hospital_slug = hospital.slug;
      profileData.subscription_status = hospital.subscription_status;
      profileData.trial_end_date = hospital.trial_end_date;
    }
  }

  // 2. Add role-specific data
  if (profile.role === 'Doctor') {
    const { data: doctor } = await (supabaseAdmin || supabase)
      .from('doctors')
      .select('*, department:department_id(name)')
      .eq('user_id', userId)
      .single();

    if (doctor) {
      profileData.doctorProfile = {
        _id: doctor.id,
        qualifications: doctor.qualifications,
        experience: doctor.experience,
        fees: doctor.fees,
        primaryDepartment: doctor.department,
        availableSlots: doctor.available_slots,
        isActive: doctor.is_active,
        gender: doctor.gender,
        dateOfBirth: doctor.date_of_birth,
        medicalCouncilId: doctor.medical_council_id,
        profilePhoto: doctor.profile_photo || '',
        digitalSignature: doctor.digital_signature || '',
        shortBio: doctor.short_bio,
        detailedBiography: doctor.detailed_biography,
        specialInterests: doctor.special_interests,
        featuredTreatments: doctor.featured_treatments,
        patientTestimonials: doctor.patient_testimonials,
      };
    }
  } else if (profile.role === 'Receptionist') {
    const { data: receptionist } = await (supabaseAdmin || supabase)
      .from('receptionists')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (receptionist) {
      profileData.receptionistProfile = {
        _id: receptionist.id,
        profilePhoto: receptionist.profile_photo || '',
        gender: receptionist.gender,
        dateOfBirth: receptionist.date_of_birth,
        shift: receptionist.shift,
        joiningDate: receptionist.joining_date,
        experience: receptionist.experience,
        educationLevel: receptionist.education_level,
        idProofType: receptionist.id_proof_type,
        idProofNumber: receptionist.id_proof_number,
        idProofDocument: receptionist.id_proof_document || '',
        digitalSignature: receptionist.digital_signature || '',
        isActive: receptionist.is_active,
      };
    }
  } else if (profile.role === 'Admin') {
    const { data: admin } = await (supabaseAdmin || supabase)
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (admin) {
      profileData.adminProfile = {
        _id: admin.id,
        profilePhoto: admin.profile_photo || '',
        digitalSignature: admin.digital_signature || '',
        gender: admin.gender,
        dateOfBirth: admin.date_of_birth,
        joiningDate: admin.joining_date,
        isActive: admin.is_active,
      };
    }
  }

  return profileData;
}
