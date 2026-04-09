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
    amount?: number;
    quantity: number;
    total: number;
    source_id?: string;
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
      userProfile, discount = 0, roundOff = 0, notes,
      appointmentId
    } = options;

    const client = (supabaseAdmin || supabase);

    // 0. Consolidation Check: If a bill already exists for this specific clinical request, SKIP
    if (sourceType === 'Laboratory' || sourceType === 'Radiology' || sourceType === 'Pharmacy') {
      const { data: existingReqBill } = await client
        .from('bills')
        .select('*')
        .eq('clinical_request_id', sourceId)
        .maybeSingle();
      
      if (existingReqBill) {
        // Even if bill exists, if it's currently linked to an appointment and we have one, just return it
        return existingReqBill;
      }
    }

    // 0.1 Check for Existing Appointment Bill to Consolidate
    let existingBill = null;
    const aptIdToFetch = appointmentId || (sourceType === 'Appointment' ? sourceId : null);
    
    if (aptIdToFetch) {
      // If we have an appointment ID, ALWAYS try to consolidate into its PENDING bill
      const { data: found } = await client
        .from('bills')
        .select('*')
        .eq('public_appointment_id', aptIdToFetch)
        .eq('payment_status', 'Pending')
        .maybeSingle();
      existingBill = found;
    } 
    
    if (!existingBill && (sourceType === 'Laboratory' || sourceType === 'Radiology' || sourceType === 'Pharmacy')) {
      // SMART CONSOLIDATION: Find recent standalone bill for same patient to group tests/services together
      const fiveMinutesAgo = new Date(Date.now() - 300 * 1000).toISOString();
      const { data: recentBill } = await client
        .from('bills')
        .select('*')
        .eq('patient_id', patientId)
        .eq('payment_status', 'Pending')
        .is('public_appointment_id', null)
        .gt('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      existingBill = recentBill;
    }

    // 1. Prepare/Append Services
    let newServices = (services || []).map(s => ({
      ...s,
      amount: s.amount || s.price || s.total || 0,
      price: s.price || s.amount || 0,
      total: s.total || s.price || s.amount || 0,
      quantity: s.quantity || 1,
      source_id: s.source_id || (sourceType !== 'Appointment' ? sourceId : undefined)
    }));

    let finalizedServices = [...newServices];

    if (existingBill) {
        // Avoid duplicate line items if source_id is the same
        const existingSourceIds = new Set((existingBill.services || []).map((s: any) => s.source_id).filter(Boolean));
        const nonDuplicateNewServices = newServices.filter(s => !s.source_id || !existingSourceIds.has(s.source_id));
        
        if (nonDuplicateNewServices.length === 0 && existingBill.services?.length > 0) {
           return existingBill; // Nothing new to add
        }
        
        finalizedServices = [...(existingBill.services || []), ...nonDuplicateNewServices];
    } else if (sourceType === 'Appointment' && finalizedServices.length === 0) {
      const { data: apt } = await client.from('public_appointments').select('doctor_assigned_id, department').eq('id', sourceId).single();
      let fee = 5000;
      if (apt?.doctor_assigned_id) {
         const { data: doctor } = await client.from('doctors').select('fees').eq('id', apt.doctor_assigned_id).single();
         if (doctor?.fees) fee = doctor.fees;
      }
      finalizedServices = [{ id: 'consultation', name: 'Medical Consultation', price: fee, amount: fee, quantity: 1, total: fee, source_id: sourceId }];
    }

    // 2. Calculate totals
    const subtotal = finalizedServices.reduce((sum, s) => sum + s.total, 0);
    const disc = existingBill?.discount || discount;
    const rnd = existingBill?.round_off || roundOff;
    const totalAmount = Math.max(0, subtotal - disc + rnd);

    // 3. Generate specialized invoice numbers
    const prefix = sourceType === 'Laboratory' ? 'INV-LAB' :
                   sourceType === 'Radiology' ? 'INV-RAD' :
                   sourceType === 'Appointment' ? 'INV-APT' : 'INV-GEN';

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const billNumber = existingBill?.bill_number || `${prefix}-${dateStr}-${randomSuffix}`;

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
      payment_method: existingBill?.payment_method || 'Pending',
      notes: notes || existingBill?.notes || `Automated billing for ${sourceType} service`,
      generated_by: { name: userProfile?.name, role: userProfile?.role }
    };

    if (appointmentId || sourceType === 'Appointment') {
      billData.public_appointment_id = appointmentId || existingBill?.public_appointment_id || (sourceType === 'Appointment' ? sourceId : null);
    }
    
    if (sourceType === 'Laboratory' || sourceType === 'Radiology' || sourceType === 'Pharmacy') {
      // For consolidated bills, we keep the original clinical_request_id if it exists, otherwise use current
      billData.clinical_request_id = existingBill?.clinical_request_id || sourceId;
    }

    let finalBill: any = null;
    if (existingBill) {
      const currentPaid = existingBill.paid_amount || 0;
      const newDue = Math.max(0, totalAmount - currentPaid);
      let newStatus = existingBill.payment_status;

      if (newDue > 0) {
        newStatus = currentPaid > 0 ? 'Partial' : 'Pending';
      } else if (totalAmount > 0 && currentPaid >= totalAmount) {
        newStatus = 'Paid';
      }

      const { data: updated, error: updateError } = await client.from('bills').update({
        services: finalizedServices,
        subtotal,
        total_amount: totalAmount,
        due_amount: newDue,
        payment_status: newStatus,
        clinical_request_id: billData.clinical_request_id,
        public_appointment_id: billData.public_appointment_id
      }).eq('id', existingBill.id).select().single();
      if (updateError) throw updateError;
      finalBill = updated;
    } else {
      const { data: created, error: createError } = await client.from('bills').insert([billData]).select().single();
      if (createError) throw createError;
      finalBill = created;
    }

    // 5. Update source record (Crucial for UI linkage)
    if (sourceType === 'Laboratory' || sourceType === 'Radiology' || sourceType === 'Pharmacy') {
      await client.from('clinical_requests').update({ 
        bill_id: finalBill.id, 
        payment_status: 'Billed' 
      }).eq('id', sourceId);
    }

    return finalBill;
  }
};
