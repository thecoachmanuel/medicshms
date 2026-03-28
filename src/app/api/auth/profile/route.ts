import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const profile = await getAuthUser(request);

    if (!profile) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    console.log(`[Profile API] Returning profile for ${profile.email}, Hospital Slug: "${profile.hospital?.slug || ''}"`);
    return NextResponse.json({
      _id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      phone: profile.phone,
      hospital_id: profile.hospital_id,
      hospital_slug: profile.hospital?.slug
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
