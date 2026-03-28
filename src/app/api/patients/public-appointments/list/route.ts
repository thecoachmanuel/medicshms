import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase.from('public_appointments').select('*');

    // Doctor: only see patients assigned to them
    if (userProfile?.role === 'Doctor') {
      const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', userProfile?.id).single();
      if (!doctor) {
        return NextResponse.json({ success: false, message: 'Doctor profile not found' }, { status: 404 });
      }
      query = query.eq('doctor_assigned_id', doctor.id);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email_address.ilike.%${search}%,patient_id.ilike.%${search}%,mobile_number.ilike.%${search}%`);
    }

    const { data: rawAppointments, error } = await query.order('appointment_date', { ascending: false });
    if (error) throw error;

    const patientMap: Record<string, any> = {};
    (rawAppointments || []).forEach(apt => {
      if (!patientMap[apt.patient_id]) {
        patientMap[apt.patient_id] = {
          _id: apt.patient_id,
          patientId: apt.patient_id,
          fullName: apt.full_name,
          emailAddress: apt.email_address,
          mobileNumber: apt.mobile_number,
          gender: apt.gender,
          dateOfBirth: apt.date_of_birth,
          age: apt.age,
          lastVisit: apt.appointment_date,
          totalAppointments: 0,
          knownAllergies: apt.known_allergies,
          existingConditions: apt.existing_conditions
        };
      }
      patientMap[apt.patient_id].totalAppointments++;
    });

    const sortedPatients = Object.values(patientMap).sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
    const skip = (page - 1) * limit;
    const patients = sortedPatients.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total: sortedPatients.length,
        pages: Math.ceil(sortedPatients.length / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
