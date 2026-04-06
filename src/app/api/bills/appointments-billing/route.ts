import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { profile: userProfile, error: authError } = await withAuth(request, ['Admin', 'Receptionist']);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 1. Fetch ALL bills for this hospital with patient and appointment info
    const { data: allBills, error: billError } = await (supabaseAdmin || supabase)
      .from('bills')
      .select(`
        *,
        patient:patients!patient_id(full_name, patient_id, gender, date_of_birth),
        appointment:public_appointments!public_appointment_id(*)
      `)
      .eq('hospital_id', userProfile?.hospital_id)
      .order('created_at', { ascending: false });

    if (billError) throw billError;

    // 2. Fetch ALL appointments that DON'T have bills yet
    const billedAppointmentIds = (allBills || [])
      .filter(b => b.public_appointment_id)
      .map(b => b.public_appointment_id);

    let aptQuery = (supabaseAdmin || supabase)
      .from('public_appointments')
      .select('*, doctors!doctor_assigned_id(*, profiles!user_id(name))')
      .eq('hospital_id', userProfile?.hospital_id);

    if (billedAppointmentIds.length > 0) {
      aptQuery = aptQuery.not('id', 'in', `(${billedAppointmentIds.join(',')})`);
    }

    const { data: unbilledAppointments, error: aptError } = await aptQuery.order('created_at', { ascending: false });
    if (aptError) throw aptError;

    // 3. Transform Bills into the View Schema
    const billEntries = (allBills || []).map(bill => {
      const apt = bill.appointment;
      return {
        _id: bill.id,
        fullName: bill.patient?.full_name || apt?.full_name || 'Unknown',
        patientId: bill.patient?.patient_id || apt?.patient_id || 'N/A',
        appointmentId: apt?.appointment_id || 'STANDALONE',
        appointmentDate: apt?.appointment_date || bill.created_at,
        appointmentTime: apt?.appointment_time || '',
        department: apt?.department || 'Laboratory',
        gender: bill.patient?.gender || apt?.gender || '',
        age: apt?.age || 0,
        doctorName: (apt?.doctors as any)?.profiles?.name || null,
        appointmentStatus: apt?.appointment_status || 'Standalone',
        bill: {
          _id: bill.id,
          billNumber: bill.bill_number,
          services: bill.services || [],
          subtotal: bill.subtotal || 0,
          discount: bill.discount || 0,
          roundOff: bill.round_off || 0,
          totalAmount: bill.total_amount || 0,
          paidAmount: bill.paid_amount || 0,
          dueAmount: bill.due_amount || 0,
          paymentStatus: bill.payment_status,
          paymentMethod: bill.payment_method,
          transactionId: bill.transaction_id,
          createdAt: bill.created_at
        }
      };
    });

    // 4. Transform Unbilled Appointments
    const unbilledEntries = (unbilledAppointments || []).map(apt => ({
      _id: apt.id,
      fullName: apt.full_name,
      patientId: apt.patient_id,
      appointmentId: apt.appointment_id,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      department: apt.department,
      gender: apt.gender,
      age: apt.age,
      doctorName: (apt.doctors as any)?.profiles?.name || null,
      appointmentStatus: apt.appointment_status,
      bill: null
    }));

    // 5. Merge and Sort
    let merged = [...billEntries, ...unbilledEntries].sort((a, b) => 
      new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    );

    // Filtering logic remains the same
    if (status && status !== 'all') {
      if (status === 'not-generated') {
        merged = merged.filter(item => !item.bill);
      } else {
        merged = merged.filter(item =>
          item.bill && item.bill.paymentStatus.toLowerCase() === status.toLowerCase()
        );
      }
    }

    if (search) {
      const s = search.toLowerCase();
      merged = merged.filter(item =>
        item.fullName?.toLowerCase().includes(s) ||
        item.appointmentId?.toString().toLowerCase().includes(s) ||
        item.patientId?.toLowerCase().includes(s) ||
        item.bill?.billNumber?.toLowerCase().includes(s)
      );
    }

    const total = merged.length;
    const data = merged.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
