import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { getPresignedUrl } from '@/lib/services/storageService';

// Helper: get or create singleton template in Supabase
const getOrCreateTemplate = async (hospital_id: string) => {
    const tenantKey = `default_${hospital_id}`;
    
    let { data: template, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('key', tenantKey)
        .single();
    
    if (error && error.code === 'PGRST116') { // Not found
        const { data: newTemplate, error: insertError } = await (supabaseAdmin || supabase)
            .from('invoice_templates')
            .insert([{ key: tenantKey, hospital_id }])
            .select()
            .single();
        if (insertError) throw insertError;
        return newTemplate;
    }
    if (error) throw error;
    return template;
};

// Get invoice template
// GET /api/invoice-template
export async function GET(request: Request) {
  const { error: authError, profile } = await withAuth(request) as any;
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    const template = await getOrCreateTemplate(hospital_id);
    const logoUrl = template.hospital_logo ? await getPresignedUrl(template.hospital_logo) : '';

    return NextResponse.json({
      success: true,
      data: {
        ...template,
        _id: template.id,
        hospitalLogoUrl: logoUrl
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Update invoice template (Admin only)
// PUT /api/invoice-template
export async function PUT(request: Request) {
  const { error: authError, profile } = await withAuth(request, ['Admin']) as any;
  if (authError) return authError;

  const hospital_id = profile?.hospital_id;

  try {
    const template = await getOrCreateTemplate(hospital_id);
    const body = await request.json();
    const {
      hospitalName, hospitalAddress, contactNumber,
      emailAddress, gstNumber, cinNumber, websiteUrl,
      footerNote, termsAndConditions
    } = body;

    const updateData: any = {};
    if (hospitalName !== undefined) updateData.hospital_name = hospitalName;
    if (hospitalAddress !== undefined) updateData.hospital_address = hospitalAddress;
    if (contactNumber !== undefined) updateData.contact_number = contactNumber;
    if (emailAddress !== undefined) updateData.email_address = emailAddress;
    if (gstNumber !== undefined) updateData.gst_number = gstNumber;
    if (cinNumber !== undefined) updateData.cin_number = cinNumber;
    if (websiteUrl !== undefined) updateData.website_url = websiteUrl;
    if (footerNote !== undefined) updateData.footer_note = footerNote;
    if (termsAndConditions !== undefined) updateData.terms_and_conditions = termsAndConditions;

    const { data: updated, error } = await supabase
      .from('invoice_templates')
      .update(updateData)
      .eq('id', template.id)
      .select()
      .single();

    if (error) throw error;

    const logoUrl = updated.hospital_logo ? await getPresignedUrl(updated.hospital_logo) : '';

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        _id: updated.id,
        hospitalLogoUrl: logoUrl
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
