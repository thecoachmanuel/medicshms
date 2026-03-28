import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

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

    const subtotal = services.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
    const totalAmount = Math.max(0, subtotal - Number(discount) + Number(roundOff));

    let signatureKey = '';
    if (userProfile?.role === 'Admin') {
      const { data: admin } = await (supabaseAdmin || supabase).from('admins').select('digital_signature').eq('user_id', userProfile.id).single();
      signatureKey = admin?.digital_signature || '';
    } else if (userProfile?.role === 'Receptionist') {
      const { data: recep } = await (supabaseAdmin || supabase).from('receptionists').select('digital_signature').eq('user_id', userProfile.id).single();
      signatureKey = recep?.digital_signature || '';
    }

    const { count } = await (supabaseAdmin || supabase)
      .from('bills')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', userProfile?.hospital_id);

    const billNumber = `INV-${new Date().getFullYear()}${String((count || 0) + 1).padStart(5, '0')}`;

    const { data: bill, error: createError } = await (supabaseAdmin || supabase)
      .from('bills')
      .insert([{
        public_appointment_id: appointmentId,
        hospital_id: userProfile?.hospital_id,
        doctor_id: appointment.doctor_assigned_id,
        patient_id: appointment.patient_id,
        bill_number: billNumber,
        services,
        subtotal,
        discount: Number(discount),
        round_off: Number(roundOff),
        total_amount: totalAmount,
        paid_amount: 0,
        due_amount: totalAmount,
        payment_status: 'Pending',
        generated_by: {
          name: userProfile?.name,
          role: userProfile?.role
        },
        generated_by_signature: signatureKey
      }])
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json({ success: true, data: { ...bill, _id: bill.id } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
