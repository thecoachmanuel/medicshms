import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/services/emailService';

export async function POST(request: Request) {
  try {
    const appointmentData = await request.json();

    // 2. Validate required fields
    const requiredFields = ['fullName', 'gender', 'emailAddress', 'appointmentDate', 'appointmentTime', 'visitType'];
    for (const field of requiredFields) {
      if (!appointmentData[field]) {
        return NextResponse.json({ success: false, message: `${field} is required` }, { status: 400 });
      }
    }

    // 3. Generate IDs
    const patientId = appointmentData.patientId || `PAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const appointmentId = `APT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // 4. Create appointment in Supabase
    const { data: appointment, error: createError } = await supabase
      .from('public_appointments')
      .insert([{
        full_name: appointmentData.fullName,
        patient_id: patientId,
        appointment_id: appointmentId,
        email_address: appointmentData.emailAddress,
        mobile_number: appointmentData.mobileNumber,
        gender: appointmentData.gender,
        date_of_birth: appointmentData.dateOfBirth,
        age: appointmentData.age,
        age_months: appointmentData.ageMonths,
        appointment_date: appointmentData.appointmentDate,
        appointment_time: appointmentData.appointmentTime,
        department: appointmentData.department,
        visit_type: appointmentData.visitType,
        reason_for_visit: appointmentData.reasonForVisit,
        primary_concern: appointmentData.primaryConcern,
        known_allergies: appointmentData.knownAllergies === 'Yes' || appointmentData.knownAllergies === true,
        allergies_details: appointmentData.allergiesDetails,
        existing_conditions: appointmentData.existingConditions,
        address: appointmentData.address,
        emergency_contact_name: appointmentData.emergencyContactName,
        emergency_contact_number: appointmentData.emergencyContactNumber,
        hospital_id: appointmentData.hospitalId
      }])
      .select()
      .single();

    if (createError) throw createError;

    // 5. Send confirmation email
    try {
      const subject = 'Appointment Confirmation';
      const text = `Dear ${appointment.full_name}, Your appointment (ID: ${appointment.appointment_id}) has been successfully booked for ${new Date(appointment.appointment_date).toLocaleDateString()} at ${appointment.appointment_time}.`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Appointment Confirmed</h2>
          <p>Dear ${appointment.full_name},</p>
          <p>Your appointment has been successfully booked.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Appointment ID:</strong> ${appointment.appointment_id}</p>
            <p><strong>Date:</strong> ${new Date(appointment.appointment_date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointment.appointment_time}</p>
            <p><strong>Department:</strong> ${appointment.department || 'General'}</p>
          </div>
          <p>Please arrive 15 minutes before your scheduled time.</p>
        </div>
      `;
      await sendEmail(appointment.email_address, subject, text, html);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointmentId: appointment.appointment_id,
        patientId: appointment.patient_id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
