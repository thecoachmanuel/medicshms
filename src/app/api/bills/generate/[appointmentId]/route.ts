import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { BillingService } from '@/lib/billing-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { error: authError, profile: userProfile } = await withAuth(request, ['Admin', 'Receptionist']);
  if (authError) return authError;

  const { appointmentId } = await params;

  try {
    const { services = [], discount = 0, roundOff = 0 } = await request.json();

    // Check if bill already exists
    const { data: existingBill } = await (supabaseAdmin || supabase)
      .from('bills')
      .select('id')
      .eq('public_appointment_id', appointmentId)
      .maybeSingle();

    if (existingBill) {
      return NextResponse.json({ success: false, message: 'Invoice already generated for this appointment' }, { status: 400 });
    }

    const { data: appointment } = await (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('doctor_assigned_id, patient_id')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });
    }

    const bill = await BillingService.generateAutoInvoice({
      hospitalId: userProfile?.hospital_id,
      patientId: appointment.patient_id,
      sourceType: 'Appointment',
      sourceId: appointmentId,
      userProfile,
      services,
      discount,
      roundOff,
      doctorId: appointment.doctor_assigned_id
    });

    return NextResponse.json({ success: true, data: { ...bill, _id: bill.id } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
