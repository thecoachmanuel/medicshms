import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

// Get all patients from public appointments with filters for download (Admin, Receptionist)
// GET /api/patients/public-appointments/download
export async function GET(request: Request) {
  const { profile: userProfile, error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get('gender');
    const ageMin = searchParams.get('ageMin');
    const ageMax = searchParams.get('ageMax');
    const visitType = searchParams.get('visitType');

    let query = (supabaseAdmin || supabase)
      .from('public_appointments')
      .select(`
        *, 
        doctors:doctor_assigned_id(*, profiles:user_id(name)),
        patient_details:patient_id(blood_group, emergency_contact_name, emergency_contact_number)
      `)
      .eq('hospital_id', userProfile?.hospital_id);

    if (gender) query = query.eq('gender', gender);
    if (ageMin) query = query.gte('age', Number(ageMin));
    if (ageMax) query = query.lte('age', Number(ageMax));
    if (visitType) query = query.eq('visit_type', visitType);

    const { data: rawAppointments, error } = await query.order('appointment_date', { ascending: false });
    if (error) throw error;

    const patientMap: Record<string, any> = {};
    (rawAppointments || []).forEach((apt: any) => {
        if (!patientMap[apt.patient_id]) {
            patientMap[apt.patient_id] = {
                _id: apt.patient_id,
                patientId: apt.patient_id,
                fullName: apt.full_name,
                emailAddress: apt.email_address,
                mobileNumber: apt.mobile_number,
                gender: apt.gender,
                age: apt.age,
                bloodGroup: (apt.patient_details as any)?.blood_group || 'N/A',
                emergencyContactName: (apt.patient_details as any)?.emergency_contact_name || 'N/A',
                emergencyContactNumber: (apt.patient_details as any)?.emergency_contact_number || 'N/A',
                totalAppointments: 0,
                appointments: []
            };
        }
        patientMap[apt.patient_id].totalAppointments++;
        patientMap[apt.patient_id].appointments.push({
            appointmentId: apt.appointment_id,
            appointmentDate: apt.appointment_date,
            appointmentTime: apt.appointment_time,
            appointmentStatus: apt.appointment_status,
            department: apt.department,
            visitType: apt.visit_type,
            doctorAssigned: apt.doctor_assigned_id,
            doctorName: apt.doctors?.profiles?.name || 'Not Assigned',
            reasonForVisit: apt.reason_for_visit || apt.primary_concern,
            cancelReason: apt.cancel_reason,
        });
    });

    const result = Object.values(patientMap);

    return NextResponse.json({
        success: true,
        data: result,
        total: result.length
    });
  } catch (error: any) {
    console.error('Download patients error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
