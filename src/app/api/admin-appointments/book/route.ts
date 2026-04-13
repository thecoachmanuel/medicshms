import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/services/emailService';
import { BillingService } from '@/lib/billing-service';

export async function POST(request: Request) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  try {
    const text = await request.text();
    if (!text) {
      console.error('Empty request body received at /api/admin-appointments/book');
      return NextResponse.json({ success: false, message: 'Request body is empty' }, { status: 400 });
    }
    
    let appointmentData;
    try {
      appointmentData = JSON.parse(text);
    } catch (e) {
      console.error('JSON Parse Error:', e, 'Raw text:', text);
      return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
    }

    // 1. Validate required fields
    const requiredFields = ['fullName', 'gender', 'emailAddress', 'appointmentDate', 'appointmentTime', 'visitType'];
    for (const field of requiredFields) {
      if (!appointmentData[field]) {
        return NextResponse.json({ success: false, message: `${field} is required` }, { status: 400 });
      }
    }

    // 2. Generate IDs
    // Generate Appointment ID (HM-YYYYMMDD-XXXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const { count } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', userProfile.hospital_id);
    const appointmentId = `HM-${dateStr}-${String((count || 0) + 1).padStart(4, '0')}`;
    
    // 3. Find or Create Patient in Registry
    let finalPatientId = appointmentData.patientId;
    
    // Check if patient exists by mobile number and hospital_id
    const { data: existingPatient } = await (supabaseAdmin || supabase)
      .from('patients')
      .select('id, patient_id')
      .eq('mobile_number', appointmentData.mobileNumber)
      .eq('hospital_id', userProfile.hospital_id)
      .single();

    if (existingPatient) {
      finalPatientId = existingPatient.patient_id;
      // Update existing patient info
      await (supabaseAdmin || supabase)
        .from('patients')
        .update({
          full_name: appointmentData.fullName,
          email_address: appointmentData.emailAddress,
          gender: appointmentData.gender,
          date_of_birth: appointmentData.dateOfBirth,
          address: appointmentData.address,
          emergency_contact_name: appointmentData.emergencyContactName,
          emergency_contact_number: appointmentData.emergencyContactNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPatient.id)
        .eq('hospital_id', userProfile.hospital_id);
    } else {
      // Create new patient record
      const newPatientId = finalPatientId || `PAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      finalPatientId = newPatientId;
      
      const { error: patientError } = await (supabaseAdmin || supabase)
        .from('patients')
        .insert([{
          patient_id: newPatientId,
          full_name: appointmentData.fullName,
          email_address: appointmentData.emailAddress,
          mobile_number: appointmentData.mobileNumber,
          gender: appointmentData.gender,
          date_of_birth: appointmentData.dateOfBirth,
          address: appointmentData.address,
          emergency_contact_name: appointmentData.emergencyContactName,
          emergency_contact_number: appointmentData.emergencyContactNumber,
          hospital_id: userProfile.hospital_id
        }]);

      if (patientError) console.error('Error creating patient record:', patientError);
    }

    // Resolve Department ID if possible for dynamic billing
    let resolvedDeptId = null;
    if (appointmentData.department && userProfile.hospital_id) {
      const { data: dept } = await (supabaseAdmin || supabase)
        .from('departments')
        .select('id')
        .eq('hospital_id', userProfile.hospital_id)
        .eq('name', appointmentData.department)
        .maybeSingle();
      resolvedDeptId = dept?.id;
    }

    // 4. Create appointment in Supabase
    const { data: appointment, error: createError } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .insert([{
        full_name: appointmentData.fullName,
        patient_id: finalPatientId,
        appointment_id: appointmentId,
        email_address: appointmentData.emailAddress,
        mobile_number: appointmentData.mobileNumber,
        gender: appointmentData.gender,
        date_of_birth: appointmentData.dateOfBirth,
        appointment_date: appointmentData.appointmentDate,
        appointment_time: appointmentData.appointmentTime,
        department: appointmentData.department,
        department_id: resolvedDeptId,
        doctor_assigned_id: appointmentData.doctorAssigned || null,
        visit_type: appointmentData.visitType,
        reason_for_visit: appointmentData.reasonForVisit,
        primary_concern: appointmentData.primaryConcern,
        known_allergies: appointmentData.knownAllergies === 'Yes' || appointmentData.knownAllergies === true,
        allergies_details: appointmentData.allergiesDetails,
        existing_conditions: appointmentData.existingConditions,
        address: appointmentData.address,
        emergency_contact_name: appointmentData.emergencyContactName,
        emergency_contact_number: appointmentData.emergencyContactNumber,
        appointment_status: 'Pending',
        hospital_id: userProfile.hospital_id
      }])
      .select()
      .single();

    if (createError) throw createError;
    
    // 5. Update patient medical history entry
    const medicalRecordEntry = {
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      type: appointment.visit_type,
      reason: appointment.reason_for_visit,
      doctor: appointmentData.doctorName || 'Assigned Doctor', // Use doctor name if available
      appointment_id: appointment.appointment_id
    };

    await (supabaseAdmin || supabase).rpc('append_medical_history', {
      p_hospital_id: userProfile.hospital_id,
      p_patient_id: appointment.patient_id,
      p_entry: medicalRecordEntry
    });

    // AUTOMATED BILLING Integration
    try {
      await BillingService.generateAutoInvoice({
        hospitalId: userProfile?.hospital_id,
        patientId: appointment.patient_id,
        sourceType: 'Appointment',
        sourceId: appointment.id,
        userProfile,
        services: [], // Omit to trigger dynamic fee lookup
        doctorId: appointment.doctor_assigned_id
      });
    } catch (billingError) {
      console.error('[Auto-Billing Failed] Booked Appointment:', billingError);
    }

    // 4. Send confirmation email (non-blocking)
    try {
      const subject = 'Appointment Confirmation';
      const text = `Dear ${appointment.full_name}, Your appointment (ID: ${appointment.appointment_id}) has been successfully booked for ${new Date(appointment.appointment_date).toLocaleDateString()} at ${appointment.appointment_time}.`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Appointment Confirmed</h2>
          <p>Dear ${appointment.full_name},</p>
          <p>Your appointment has been successfully booked by our administration.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Appointment ID:</strong> ${appointment.appointment_id}</p>
            <p><strong>Date:</strong> ${new Date(appointment.appointment_date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointment.appointment_time}</p>
            <p><strong>Department:</strong> ${appointment.department || 'General'}</p>
          </div>
          <p>Please arrive 15 minutes before your scheduled time.</p>
        </div>
      `;
      // Fire-and-forget email to avoid blocking the response
      sendEmail(appointment.email_address, subject, text, html).catch(e => 
        console.error('Failed to send confirmation email:', e)
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        _id: appointment.id,
        appointmentId: appointment.appointment_id,
        patientId: appointment.patient_id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
