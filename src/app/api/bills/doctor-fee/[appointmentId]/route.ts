import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { error: authError, profile } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  const { appointmentId } = await params;

  try {
    const { data: appointment, error: aptError } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*, doctors:doctor_assigned_id(*, profiles:user_id(name))')
      .eq('id', appointmentId)
      .eq('hospital_id', profile?.hospital_id)
      .single();

    if (aptError || !appointment) {
      // FALLBACK: Check if this is a clinical request (standalone lab test)
      const { data: labReq } = await (supabaseAdmin || supabase)
        .from('clinical_requests')
        .select('*, patient:patients!patient_id(id, full_name, patient_id)')
        .eq('id', appointmentId)
        .eq('hospital_id', profile?.hospital_id)
        .single();
      
      if (labReq) {
        return NextResponse.json({
          success: true,
          data: {
            doctorFee: 0,
            doctorName: labReq.requested_by_name || 'Laboratory Unit',
            department: { name: 'Laboratory', defaultConsultationFee: 0, services: [] },
            appointment: {
              appointmentId: 'STANDALONE',
              patientId: labReq.patient?.patient_id || labReq.patient_id,
              fullName: labReq.patient?.full_name || 'Individual Patient',
              department: 'Laboratory'
            },
            isLabStandalone: true,
            testInfo: { name: labReq.test_name, price: labReq.test_price }
          }
        });
      }

      return NextResponse.json({ success: false, message: 'Reference not found' }, { status: 404 });
    }

    let departmentData: any = null;
    if (appointment.department) {
      const { data: dept } = await (supabaseAdmin || supabase)
        .from('departments')
        .select('*')
        .eq('name', appointment.department)
        .eq('hospital_id', profile?.hospital_id)
        .eq('is_active', true)
        .single();
      if (dept) {
        departmentData = {
          _id: dept.id,
          name: dept.name,
          defaultConsultationFee: dept.default_consultation_fee || 0,
          services: (dept.services || []).map((s: any) => ({
            serviceName: s.service_name || s.serviceName,
            fee: s.fee,
            description: s.description || ''
          }))
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        doctorFee: appointment.doctors?.fees || 0,
        doctorName: appointment.doctors?.profiles?.name || 'Not Assigned',
        department: departmentData,
        appointment: {
          appointmentId: appointment.appointment_id,
          patientId: appointment.patient_id,
          fullName: appointment.full_name,
          department: appointment.department,
          mobileNumber: appointment.mobile_number,
          emailAddress: appointment.email_address
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
