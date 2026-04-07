import { supabaseAdmin, supabase } from './supabase';
import { User as UserProfile } from '@/types';

export type BillSourceType = 'Laboratory' | 'Radiology' | 'Appointment' | 'Pharmacy';

export interface BillingServiceOptions {
  hospitalId: string;
  patientId: string;
  services: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  sourceType: BillSourceType;
  sourceId: string; // The ID of the clinical_request, appointment, etc.
  userProfile: Partial<UserProfile>;
  discount?: number;
  roundOff?: number;
  notes?: string;
  doctorId?: string;
  appointmentId?: string;
}

export const BillingService = {
  /**
   * Automatically generate an invoice for a given clinical service or appointment.
   */
  async generateAutoInvoice(options: BillingServiceOptions) {
    const { 
      hospitalId, patientId, services, sourceType, sourceId, 
      userProfile, discount = 0, roundOff = 0, notes, doctorId,
      appointmentId
    } = options;

    const client = (supabaseAdmin || supabase);

    // 0. Consolidation Check: If a bill already exists for this clinical request, SKIP
    if (sourceType === 'Laboratory' || sourceType === 'Radiology' || sourceType === 'Pharmacy') {
      const { data: existingReqBill } = await client
        .from('bills')
        .select('id')
        .eq('clinical_request_id', sourceId)
        .maybeSingle();
      
      if (existingReqBill) return existingReqBill;
    }

    // 0.1 Check for Existing Appointment Bill to Consolidate
    let existingBill = null;
    const aptIdToFetch = appointmentId || (sourceType === 'Appointment' ? sourceId : null);
    if (aptIdToFetch) {
      const { data: found } = await client
        .from('bills')
        .select('*')
        .eq('public_appointment_id', aptIdToFetch)
        .eq('payment_status', 'Pending')
        .maybeSingle();
      existingBill = found;
    }

    // 1. Prepare/Append Services
    let finalizedServices = [...(services || [])];
    if (existingBill) {
       finalizedServices = [...(existingBill.services || []), ...finalizedServices];
    } else if (sourceType === 'Appointment' && finalizedServices.length === 0) {
      const { data: apt } = await client.from('public_appointments').select('doctor_assigned_id, department').eq('id', sourceId).single();
      let fee = 5000;
      if (apt?.doctor_assigned_id) {
         const { data: doctor } = await client.from('doctors').select('fees').eq('id', apt.doctor_assigned_id).single();
         if (doctor?.fees) fee = doctor.fees;
      }
      finalizedServices = [{ id: 'consultation', name: 'Medical Consultation', price: fee, quantity: 1, total: fee }];
    }

    // 2. Calculate totals
    const subtotal = finalizedServices.reduce((sum, s) => sum + s.total, 0);
    const disc = existingBill?.discount || discount;
    const rnd = existingBill?.round_off || roundOff;
    const totalAmount = Math.max(0, subtotal - disc + rnd);

    // 3. Generate specialized invoice numbers with prefix
    const prefix = sourceType === 'Laboratory' ? 'INV-LAB' :
                   sourceType === 'Radiology' ? 'INV-RAD' :
                   sourceType === 'Appointment' ? 'INV-APT' : 'INV-GEN';

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const billNumber = `${prefix}-${dateStr}-${randomSuffix}`;

    // 4. Prepare bill data
    const billData: any = {
      hospital_id: hospitalId,
      patient_id: patientId,
      bill_number: billNumber,
      services: finalizedServices,
      subtotal,
      discount: disc,
      round_off: rnd,
      total_amount: totalAmount,
      paid_amount: existingBill?.paid_amount || 0,
      due_amount: totalAmount - (existingBill?.paid_amount || 0),
      payment_status: 'Pending',
      payment_method: 'Pending',
      notes: notes || `Automated billing for ${sourceType} service`,
      generated_by: { name: userProfile?.name, role: userProfile?.role }
    };

    if (sourceType === 'Appointment') billData.public_appointment_id = sourceId;
    else if (sourceType === 'Laboratory' || sourceType === 'Radiology' || sourceType === 'Pharmacy') {
      billData.clinical_request_id = sourceId;
      if (appointmentId) billData.public_appointment_id = appointmentId;
    }

    let finalBill: any = null;
    if (existingBill) {
      const { data: updated, error: updateError } = await client.from('bills').update({
        services: finalizedServices,
        subtotal,
        total_amount: totalAmount,
        due_amount: totalAmount - (existingBill.paid_amount || 0)
      }).eq('id', existingBill.id).select().single();
      if (updateError) throw updateError;
      finalBill = updated;
    } else {
      const { data: created, error: createError } = await client.from('bills').insert([billData]).select().single();
      if (createError) throw createError;
      finalBill = created;
    }

    // 5. Update source record
    if (sourceType === 'Laboratory' || sourceType === 'Radiology' || sourceType === 'Pharmacy') {
      await client.from('clinical_requests').update({ bill_id: finalBill.id, payment_status: 'Billed' }).eq('id', sourceId);
    }
 else if (sourceType === 'Appointment') {
      // In the current schema, some appointment tables might not have bill_id col, 
      // but we ensure the status is at least 'Invoiced' conceptually
      // We can add a more explicit link if the table supports it.
    }

    return finalBill;
  }
};
