import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { calculateAge } from '@/lib/utils';
import { BillingService } from '@/lib/billing-service';

// GET all public appointments (Admin/Receptionist)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { profile: userProfile, error: authError } = await withAuth(request, ['Admin', 'Receptionist', 'Doctor', 'Lab Scientist', 'Radiologist', 'Nurse', 'Pharmacist']);
    if (authError) return authError;

    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const patientId = searchParams.get('patientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('id, appointment_id, full_name, mobile_number, email_address, appointment_date, appointment_time, department, appointment_status, age, gender, date_of_birth, primary_concern, doctor_notes, prescription, known_allergies, allergies_details, patient_id, is_calling, called_at, calling_station, doctors!doctor_assigned_id(id, profiles!user_id(name))', { count: 'exact' })
      .eq('hospital_id', userProfile?.hospital_id);

    if (patientId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
      if (isUUID) {
        // Resolve the human-readable patient_id from the UUID
        const { data: patient } = await (supabaseAdmin || supabase)
          .from('patients')
          .select('patient_id')
          .eq('id', patientId)
          .single();
        
        if (patient?.patient_id) {
          query = query.eq('patient_id', patient.patient_id);
        } else {
          // Fallback: if patient not found by UUID, try direct match (unlikely to succeed but safe)
          query = query.eq('patient_id', patientId);
        }
      } else {
        query = query.eq('patient_id', patientId);
      }
    }
    if (status && status !== 'All' && status !== 'all') query = query.eq('appointment_status', status);
    if (date) query = query.eq('appointment_date', date);
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,appointment_id.ilike.%${search}%,mobile_number.ilike.%${search}%`);
    }

    const { data: appointments, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const formatted = (appointments || []).map(apt => {
      const doctor = apt.doctors;
      const profile = (doctor as any)?.profiles;
      
      return {
        _id: apt.id,
        appointmentId: apt.appointment_id,
        fullName: apt.full_name,
        emailAddress: apt.email_address,
        mobileNumber: apt.mobile_number,
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
        department: apt.department,
        appointmentStatus: apt.appointment_status,
        age: apt.age || (apt.date_of_birth ? calculateAge(apt.date_of_birth) : null),
        gender: apt.gender,
        primaryConcern: apt.primary_concern,
        doctor_notes: apt.doctor_notes,
        prescription: apt.prescription,
        knownAllergies: apt.known_allergies ? 'Yes' : 'No',
        allergiesDetails: apt.allergies_details,
        patientId: apt.patient_id,
        is_calling: apt.is_calling,
        called_at: apt.called_at,
        calling_station: apt.calling_station,
        doctorAssigned: doctor ? {
          ...doctor,
          user: profile
        } : null
      };
    });

    return NextResponse.json({ 
      data: formatted, 
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

// Create appointment by Admin/Receptionist
export async function POST(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { 
      fullName, gender, dateOfBirth, mobileNumber, emailAddress, 
      knownAllergies, allergiesDetails, reasonForVisit, primaryConcern, 
      existingConditions, department, doctorAssigned, appointmentDate, 
      appointmentTime, address, emergencyContactName, emergencyContactNumber,
      visitType, patientId, age
    } = body;
    
    // Generate Appointment ID
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const { count } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', userProfile?.hospital_id);
      
    const appointmentId = `HM-${dateStr}-${String((count || 0) + 1).padStart(4, '0')}`;

    // Resolve Department ID if possible for dynamic billing
    let resolvedDeptId = null;
    if (department && userProfile?.hospital_id) {
      const { data: dept } = await (supabaseAdmin || supabase)
        .from('departments')
        .select('id')
        .eq('hospital_id', userProfile.hospital_id)
        .eq('name', department)
        .maybeSingle();
      resolvedDeptId = dept?.id;
    }

    const { data: appointment, error } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .insert([{
        full_name: fullName,
        gender,
        date_of_birth: dateOfBirth,
        age: age || null,
        mobile_number: mobileNumber,
        email_address: emailAddress,
        known_allergies: knownAllergies === 'Yes' || knownAllergies === true,
        allergies_details: allergiesDetails,
        reason_for_visit: reasonForVisit,
        primary_concern: primaryConcern,
        existing_conditions: existingConditions,
        department,
        department_id: resolvedDeptId,
        doctor_assigned_id: doctorAssigned || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        address,
        emergency_contact_name: emergencyContactName,
        emergency_contact_number: emergencyContactNumber,
        visit_type: visitType,
        patient_id: patientId || `PAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        appointment_id: appointmentId,
        appointment_status: 'Pending',
        hospital_id: userProfile?.hospital_id,
        created_by: userProfile?.id
      }])
      .select()
      .single();

    if (error) throw error;

    // AUTOMATED BILLING Integration
    // For manual admin/receptionist creation, we use dynamic BillingService fee resolution
    try {
      await BillingService.generateAutoInvoice({
        hospitalId: userProfile?.hospital_id,
        patientId: patientId || appointment.patient_id,
        sourceType: 'Appointment',
        sourceId: appointment.id,
        userProfile,
        services: [], // Omit services to trigger dynamic fee lookup (Doctor fee -> Dept fee -> Fallback)
        doctorId: doctorAssigned
      });
    } catch (billingError) {
      console.error('[Auto-Billing Failed] Appointment:', billingError);
    }

    return NextResponse.json({ ...appointment, _id: appointment.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
