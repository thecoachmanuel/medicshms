import { supabase, supabaseAdmin } from "./supabase";
import { NextResponse } from "next/server";

/**
 * Helper to get the authenticated user from the request header
 */
export async function getAuthUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] Missing or invalid auth header');
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.log('[Auth] Supabase getUser failed:', error?.message);
    return null;
  }

  // Fetch profile with hospital slug
  const { data: profile, error: profileError } = await (supabaseAdmin || supabase)
    .from('profiles')
    .select('*, hospital:hospitals(slug)')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.log('[Auth] Profile lookup failed:', profileError?.message);
    return null;
  }

  if (!profile.is_active) {
    console.log('[Auth] User account inactive');
    return null;
  }

  return profile;
}

/**
 * Middleware-like wrapper for API routes that require authentication
 */
export async function withAuth(request: Request, roles?: string[]) {
  const profile = await getAuthUser(request);

  if (!profile) {
    return { error: NextResponse.json({ message: 'Not authorized' }, { status: 401 }), profile: null };
  }

  if (roles && !roles.includes(profile.role)) {
    return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }), profile: null };
  }

  return { error: null, profile };
}
