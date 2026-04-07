import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { calculateAge } from '@/lib/utils';

// GET all patients
export async function GET(request: Request) {
  try {
    const { profile: userProfile, error: authError } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor', 'Nurse', 'Lab Scientist', 'Radiologist', 'Pharmacist']);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = (supabaseAdmin || supabase)
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('hospital_id', userProfile?.hospital_id);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,mobile_number.ilike.%${search}%,patient_id.ilike.%${search}%,email_address.ilike.%${search}%`);
    }

    const { data: patients, error, count } = await query
      .order('full_name')
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    const formattedPatients = (patients || []).map(p => ({
      ...p,
      _id: p.id,
      patientId: p.patient_id,
      fullName: p.full_name,
      mobileNumber: p.mobile_number,
      emailAddress: p.email_address,
      dateOfBirth: p.date_of_birth,
      age: p.age || calculateAge(p.date_of_birth),
      bloodGroup: p.blood_group,
      emergencyContactName: p.emergency_contact_name,
      emergencyContactNumber: p.emergency_contact_number,
      totalAppointments: 0 
    }));

    return NextResponse.json({ 
      data: formattedPatients, 
      pagination: { 
        total: count || 0, 
        pages: Math.ceil((count || 0) / limit),
        currentPage: page
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST create patient profile
export async function POST(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Admin', 'Receptionist', 'Patient', 'Nurse', 'Doctor', 'Lab Scientist', 'Clinical Scientist', 'Radiologist', 'Pharmacist']);
  
  if (authError) return authError;

  try {
    const body = await request.json();
    console.log('Registration request body:', body);
    console.log('Registration user profile role:', userProfile?.role);
    const isAdmin = userProfile?.role === 'Admin' || userProfile?.role === 'Receptionist';
    
    // If not admin, use current user's profile
    const userId = isAdmin ? body.userId : userProfile?.id;
    const mobileNumber = body.mobileNumber;

    // Check if patient profile already exists within THIS hospital
    let existingProfile = null;
    const shouldCheck = userId || (mobileNumber && !mobileNumber.startsWith('RAPID-'));

    if (shouldCheck) {
      const query = (supabaseAdmin || supabase)
        .from('patients')
        .select('id')
        .eq('hospital_id', userProfile?.hospital_id);

      if (userId) {
        query.eq('user_id', userId);
      } else if (mobileNumber) {
        query.eq('mobile_number', mobileNumber);
      }
      
      const { data } = await query.maybeSingle();
      existingProfile = data;
    }

    if (existingProfile) return NextResponse.json({ message: 'Patient profile already exists in this hospital' }, { status: 400 });

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const { count } = await (supabaseAdmin || supabase)
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', userProfile?.hospital_id);
      
    const patientId = body.patientId || `PAT-${dateStr}-${String((count || 0) + 1).padStart(4, '0')}`;

    const insertData: any = {
      patient_id: patientId,
      full_name: body.fullName,
      email_address: body.emailAddress,
      mobile_number: body.mobileNumber,
      gender: body.gender,
      date_of_birth: body.dateOfBirth,
      age: calculateAge(body.dateOfBirth),
      blood_group: body.bloodGroup,
      address: body.address,
      emergency_contact_name: body.emergencyContactName,
      emergency_contact_number: body.emergencyContactNumber,
      medical_history: body.medicalHistory || []
    };

    if (userId) insertData.user_id = userId;
    insertData.hospital_id = userProfile?.hospital_id;

    const { data: patient, error } = await (supabaseAdmin || supabase)
      .from('patients')
      .insert([insertData])
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    if (!patient) return NextResponse.json({ message: 'Failed to create patient record' }, { status: 400 });
    
    return NextResponse.json({ ...patient, _id: patient.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
