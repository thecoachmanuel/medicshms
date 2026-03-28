import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { uploadToS3, deleteFromS3, getPresignedUrl } from '@/lib/services/storageService';

// Helper: get or create singleton template
const getOrCreateTemplate = async () => {
    let { data: template, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('key', 'default')
        .single();
    
    if (error && error.code === 'PGRST116') {
        const { data: newTemplate, error: insertError } = await supabase
            .from('invoice_templates')
            .insert([{ key: 'default' }])
            .select()
            .single();
        if (insertError) throw insertError;
        return newTemplate;
    }
    if (error) throw error;
    return template;
};

// Upload hospital logo (Admin only)
// POST /api/invoice-template/upload-logo
export async function POST(request: Request) {
  const { error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });

    const template = await getOrCreateTemplate();

    if (template.hospital_logo) {
      await deleteFromS3(template.hospital_logo);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToS3(buffer, 'invoice-logos');
    
    const { error: updateError } = await supabase
      .from('invoice_templates')
      .update({ hospital_logo: url })
      .eq('id', template.id);

    if (updateError) throw updateError;

    const signedUrl = await getPresignedUrl(url);

    return NextResponse.json({
      success: true,
      data: { url: signedUrl, key: url },
      message: 'Hospital logo uploaded successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
