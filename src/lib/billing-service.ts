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
}

export const BillingService = {
  /**
   * Automatically generate an invoice for a given clinical service or appointment.
   */
  async generateAutoInvoice(options: BillingServiceOptions) {
    const { 
      hospitalId, patientId, services, sourceType, sourceId, 
      userProfile, discount = 0, roundOff = 0, notes, doctorId 
    } = options;

    const client = (supabaseAdmin || supabase);

    // 0. Robust Fee Detection (for Appointments if services not provided)
    let finalizedServices = [...(services || [])];
    if (sourceType === 'Appointment' && finalizedServices.length === 0) {
      // Try to fetch doctor fee or department fee
      const { data: apt } = await client
        .from('public_appointments')
        .select('doctor_assigned_id, department')
        .eq('id', sourceId)
        .single();
      
      let fee = 5000; // Final fallback
      let serviceName = 'Medical Consultation';

      if (apt?.doctor_assigned_id) {
         const { data: doctor } = await client.from('doctors').select('fees').eq('id', apt.doctor_assigned_id).single();
         if (doctor?.fees) fee = doctor.fees;
      } else if (apt?.department) {
         const { data: dept } = await client.from('departments').select('default_consultation_fee').eq('name', apt.department).single();
         if (dept?.default_consultation_fee) fee = dept.default_consultation_fee;
      }

      finalizedServices = [{
        id: 'consultation',
        name: serviceName,
        price: fee,
        quantity: 1,
        total: fee
      }];
    }

    // 1. Calculate totals
    const subtotal = finalizedServices.reduce((sum, s) => sum + s.total, 0);
    const totalAmount = Math.max(0, subtotal - discount + roundOff);

    // 2. Generate specialized invoice numbers with prefix
    const prefix = sourceType === 'Laboratory' ? 'INV-LAB' :
                   sourceType === 'Radiology' ? 'INV-RAD' :
                   sourceType === 'Appointment' ? 'INV-APT' : 'INV-GEN';

    // We use a robust format: [Prefix]-[YYMMDD]-[8-char-RandomSuffix] for high collision resistance
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase() + 
                         Math.random().toString(36).substring(2, 6).toUpperCase();
    const billNumber = `${prefix}-${dateStr}-${randomSuffix}`;

    // 3. Fetch generating staff signature if available
    let signatureKey = '';
    const { data: staffProfile } = await client
      .from('profiles')
      .select('role')
      .eq('id', userProfile.id)
      .single();

    if (staffProfile) {
      let specTable = '';
      if (staffProfile.role === 'Admin') specTable = 'admins';
      else if (staffProfile.role === 'Receptionist') specTable = 'receptionists';
      else if (staffProfile.role === 'Doctor') specTable = 'doctors';
      else if (staffProfile.role === 'Lab Scientist') specTable = 'lab_scientists';

      if (specTable) {
        const { data: spec } = await client
          .from(specTable)
          .select('digital_signature')
          .eq('user_id', userProfile.id)
          .single();
        signatureKey = spec?.digital_signature || '';
      }
    }

    // 4. Create the bill
    const billData: any = {
      hospital_id: hospitalId,
      patient_id: patientId,
      bill_number: billNumber,
      services: finalizedServices,
      subtotal,
      discount,
      round_off: roundOff,
      total_amount: totalAmount,
      paid_amount: 0,
      due_amount: totalAmount,
      payment_status: 'Pending',
      payment_method: 'Pending',
      notes: notes || `Automated billing for ${sourceType} service`,
      generated_by: {
        name: userProfile?.name,
        role: userProfile?.role
      },
      generated_by_signature: signatureKey
    };

    // Link source-specific fields
    if (sourceType === 'Appointment') {
      billData.public_appointment_id = sourceId;
    }
    if (doctorId) {
      billData.doctor_id = doctorId;
    }

    const { data: bill, error: billError } = await client
      .from('bills')
      .insert([billData])
      .select()
      .single();

    if (billError) throw billError;

    // 5. Update the source record with the bill_id and mark as Billed
    if (sourceType === 'Laboratory' || sourceType === 'Radiology' || sourceType === 'Pharmacy') {
      await client
        .from('clinical_requests')
        .update({ 
          bill_id: bill.id,
          payment_status: 'Billed'
        })
        .eq('id', sourceId);
    } else if (sourceType === 'Appointment') {
      // In the current schema, some appointment tables might not have bill_id col, 
      // but we ensure the status is at least 'Invoiced' conceptually
      // We can add a more explicit link if the table supports it.
    }

    return bill;
  }
};
