import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { AIAgent } from '@/lib/ai/ai-agent';

export async function POST(request: Request) {
  const { error: authError, profile } = await withAuth(request) as any;
  if (authError) return authError;

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ message: 'Prompt is required' }, { status: 400 });
    }

    const response = await AIAgent.chat(prompt, {
      userId: profile.id,
      hospitalId: profile.hospital_id,
      role: profile.role
    });

    return NextResponse.json({ success: true, ...response });
  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
