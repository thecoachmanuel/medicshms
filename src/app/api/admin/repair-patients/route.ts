import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';

/**
 * Administrative Utility: Patient Account Repair & Provisioning
 * 
 * Objectives:
 * 1. Find patients without a linked user_id.
 * 2. Auto-provision auth.users accounts for patients with missing credentials.
 * 3. Upsert profiles to ensure every patient can log in with hms@patient.
 */
export async function POST(request: Request) {
  try {
    const { profile: userProfile, error: authError } = await withAuth(request, ['Admin']);
    if (authError) return authError;

    const hospitalId = userProfile?.hospital_id;
    if (!hospitalId || !supabaseAdmin) {
      return NextResponse.json({ success: false, message: 'Administrative context missing' }, { status: 400 });
    }

    const report = {
      patientsProcessed: 0,
      accountsCreated: 0,
      profilesLinked: 0,
      errors: [] as string[]
    };

    // 1. Fetch all patients in this hospital
    const { data: patients, error: fetchPatientsError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('hospital_id', hospitalId);

    if (fetchPatientsError) throw fetchPatientsError;

    if (!patients || patients.length === 0) {
        return NextResponse.json({ success: true, message: 'No patient records found to process', report });
    }

    for (const patient of patients) {
      report.patientsProcessed++;
      let userId = patient.user_id;

      // Normalize identifiers
      const email = patient.email_address?.trim().toLowerCase();
      const phone = patient.mobile_number?.trim();

      if (!email && !phone) {
        report.errors.push(`Patient ${patient.patient_id || patient.id}: No identifiers (email/phone). Skipping.`);
        continue;
      }

      // 2. Check if a profile already exists for these identifiers
      if (!userId) {
        const orClause = [
            email ? `email.eq.${email}` : null,
            phone ? `phone.eq.${phone}` : null
        ].filter(Boolean).join(',');

        if (orClause) {
            const { data: existingProfile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .or(orClause)
                .maybeSingle();
            
            if (existingProfile) {
                userId = existingProfile.id;
                console.log(`[Repair] Found existing profile for patient ${patient.patient_id}: ${userId}`);
            }
        }
      }

      // 3. Create auth user if still no userId
      if (!userId) {
        const authIdentifier = email || phone;
        if (authIdentifier) {
            const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
                [email ? 'email' : 'phone']: authIdentifier,
                password: 'hms@patient',
                email_confirm: true,
                phone_confirm: true,
                user_metadata: {
                  name: patient.full_name,
                  role: 'Patient',
                  hospital_id: hospitalId
                }
            });

            if (createAuthError) {
                if (createAuthError.message.includes('already exists')) {
                   report.errors.push(`Patient ${patient.patient_id}: Auth identity already in use elsewhere.`);
                } else {
                   report.errors.push(`Patient ${patient.patient_id}: Auth creation failed - ${createAuthError.message}`);
                }
                continue;
            } else if (authData.user) {
                userId = authData.user.id;
                report.accountsCreated++;
            }
        }
      }

      // 4. Ensure Profile exists and is linked properly
      if (userId) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            name: patient.full_name,
            email: email || null,
            phone: phone || null,
            role: 'Patient',
            hospital_id: hospitalId,
            is_active: true
          });

        if (profileError) {
          report.errors.push(`Patient ${patient.patient_id}: Profile sync failed - ${profileError.message}`);
        } else {
          // Update patient record to link user_id if not already set or changed
          if (patient.user_id !== userId) {
              const { error: linkError } = await supabaseAdmin
                .from('patients')
                .update({ user_id: userId })
                .eq('id', patient.id);
              
              if (linkError) {
                  report.errors.push(`Patient ${patient.patient_id}: Linking to record failed - ${linkError.message}`);
              } else {
                  report.profilesLinked++;
              }
          } else {
              report.profilesLinked++; // Already linked correctly
          }
        }
      }
    }

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.error('[Patient Repair API Error]:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
