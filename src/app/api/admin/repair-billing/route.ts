import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

/**
 * Administrative Utility: Legacy Billing Data Repair
 * 
 * Objectives:
 * 1. Resolve and save department_id for historical appointments.
 * 2. Update 'Pending' invoices with the correct departmental fee (if they have the old 5000 NGN price).
 */
export async function POST(request: Request) {
  try {
    const { profile: userProfile, error: authError } = await withAuth(request, ['Admin']);
    if (authError) return authError;

    const hospitalId = userProfile?.hospital_id;
    if (!hospitalId) {
      return NextResponse.json({ success: false, message: 'Hospital context missing' }, { status: 400 });
    }

    const client = (supabaseAdmin || supabase);

    const report = {
      appointmentsProcessed: 0,
      appointmentsLinked: 0,
      billsProcessed: 0,
      billsUpdated: 0,
      errors: [] as string[]
    };

    // --- STEP 1: Backfill missing department_id in appointments ---
    const { data: untaggedApts, error: fetchAptError } = await client
      .from('public_appointments')
      .select('id, department')
      .eq('hospital_id', hospitalId)
      .is('department_id', null);

    if (fetchAptError) throw fetchAptError;

    if (untaggedApts && untaggedApts.length > 0) {
      report.appointmentsProcessed = untaggedApts.length;

      // Get all departments for this hospital to map names to IDs
      const { data: depts } = await client
        .from('departments')
        .select('id, name')
        .eq('hospital_id', hospitalId);
      
      const nameToId = (depts || []).reduce((acc, d) => {
        acc[d.name] = d.id;
        return acc;
      }, {} as Record<string, string>);

      for (const apt of untaggedApts) {
        if (apt.department && nameToId[apt.department]) {
          const { error } = await client
            .from('public_appointments')
            .update({ department_id: nameToId[apt.department] })
            .eq('id', apt.id);
          
          if (!error) report.appointmentsLinked++;
          else report.errors.push(`Apt ${apt.id} Update Error: ${error.message}`);
        }
      }
    }

    // --- STEP 2: Update Pending Bills with Legacy Prices ---
    // Fetch pending bills with department info through the appointment link
    const { data: pendingBills, error: fetchBillError } = await client
      .from('bills')
      .select(`
        *,
        appointment:public_appointments!public_appointment_id(department_id)
      `)
      .eq('hospital_id', hospitalId)
      .eq('payment_status', 'Pending');

    if (fetchBillError) throw fetchBillError;

    if (pendingBills && pendingBills.length > 0) {
      report.billsProcessed = pendingBills.length;

      // Get correct fees map
      const { data: deptsWithFees } = await client
        .from('departments')
        .select('id, default_consultation_fee')
        .eq('hospital_id', hospitalId);
      
      const idToFee = (deptsWithFees || []).reduce((acc, d) => {
        acc[d.id] = d.default_consultation_fee;
        return acc;
      }, {} as Record<string, number>);

      for (const bill of pendingBills) {
        const deptId = (bill as any).appointment?.department_id;
        if (!deptId || idToFee[deptId] === undefined) continue;

        const targetFee = idToFee[deptId];
        let wasModified = false;
        
        const updatedServices = (bill.services || []).map((s: any) => {
          // Identify the consultation line item
          const isConsultation = s.name === 'Medical Consultation' || 
                              s.name === 'General Consultation' || 
                              s.id === 'consultation';

          // If price is exactly 5000 (old hardcoded) and it's different from what it should be
          if (isConsultation && s.price === 5000 && s.price !== targetFee) {
             wasModified = true;
             const qty = s.quantity || 1;
             return {
               ...s,
               price: targetFee,
               amount: targetFee,
               total: targetFee * qty
             };
          }
          return s;
        });

        if (wasModified) {
          const subtotal = updatedServices.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
          const totalAmount = Math.max(0, subtotal - (bill.discount || 0) + (bill.round_off || 0));
          const dueAmount = totalAmount - (bill.paid_amount || 0);

          const { error } = await client
            .from('bills')
            .update({
              services: updatedServices,
              subtotal,
              total_amount: totalAmount,
              due_amount: dueAmount
            })
            .eq('id', bill.id);
            
          if (!error) report.billsUpdated++;
          else report.errors.push(`Bill ${bill.id} Update Error: ${error.message}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Repair operation completed',
      report 
    });

  } catch (error: any) {
    console.error('[Repair Utility Error]:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Legacy repair failed' 
    }, { status: 500 });
  }
}
