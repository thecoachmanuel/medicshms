import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Pharmacist', 'Doctor', 'Admin', 'Nurse', 'Receptionist', 'Lab Scientist', 'Radiologist']);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const status = searchParams.get('status');

  try {
    let query = (supabaseAdmin || supabase)
      .from('prescriptions')
      .select(`
        *,
        patient:patient_id(full_name, patient_id),
        doctor_profile:doctor_id(name),
        pharmacist_profile:pharmacist_id(name)
      `)
      .eq('hospital_id', profile?.hospital_id)
      .order('prescribed_at', { ascending: false });

    if (patientId) query = query.eq('patient_id', patientId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Doctor']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { patient_id, appointment_id, medications, notes } = body;

    const insertData = {
      hospital_id: profile?.hospital_id,
      patient_id,
      appointment_id: appointment_id || null,
      doctor_id: profile?.id,
      status: 'Pending',
      medications: medications || [],
      notes
    };

    const { data, error } = await (supabaseAdmin || supabase)
      .from('prescriptions')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Pharmacist']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { prescription_id, status, inventory_deductions } = body; 
    // inventory_deductions = [{ id: inventory_id, quantity: number }]

    // Begin updates
    if (inventory_deductions && inventory_deductions.length > 0) {
      for (const item of inventory_deductions) {
        // Decrement quantity. Supabase RPC is better, but we can read/update here since it's an admin bypass
        const { data: invData } = await (supabaseAdmin || supabase)
          .from('pharmacy_inventory')
          .select('quantity')
          .eq('id', item.id)
          .single();
        
        if (invData) {
          const newQty = Math.max(0, invData.quantity - item.quantity);
          await (supabaseAdmin || supabase)
            .from('pharmacy_inventory')
            .update({ quantity: newQty })
            .eq('id', item.id);
        }
      }
    }

    const updateData: any = {
      status,
      pharmacist_id: profile?.id
    };

    if (status === 'Dispensed') updateData.dispensed_at = new Date().toISOString();

    const { data, error } = await (supabaseAdmin || supabase)
      .from('prescriptions')
      .update(updateData)
      .eq('id', prescription_id)
      .eq('hospital_id', profile?.hospital_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
