import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth } from '@/lib/auth';
import { deleteFromS3 } from '@/lib/services/storageService';

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

// Remove hospital logo (Admin only)
// DELETE /api/invoice-template/logo
export async function DELETE(request: Request) {
  const { error: authError } = await withAuth(request, ['Admin']);
  if (authError) return authError;

  try {
    const template = await getOrCreateTemplate();

    if (template.hospital_logo) {
      await deleteFromS3(template.hospital_logo);
      const { error } = await supabase
        .from('invoice_templates')
        .update({ hospital_logo: '' })
        .eq('id', template.id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'Hospital logo removed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
