import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { uploadFile } from '@/lib/storageService';

export async function POST(request: Request) {
  const { error: authError } = await withAuth(request, ['Admin', 'Platform Admin']);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'hms-cms';

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64 for Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    const uploadResult = await uploadFile(base64Image, folder);

    return NextResponse.json({ 
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
