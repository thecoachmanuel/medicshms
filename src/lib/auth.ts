import { supabase, supabaseAdmin, supabaseUrl, supabaseAnonKey } from "./supabase";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizeRole, isPlatformAdmin } from "./auth-helpers";

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

  // Fetch profile with hospital slug and clinical unit associations
  const { data: profile, error: profileError } = await (supabaseAdmin || supabase)
    .from('profiles')
    .select(`
      *,
      hospital:hospitals(slug),
      doctor_record:doctors(id, department_id),
      receptionist_record:receptionists(id, department_id),
      nurse_record:nurses(id, department_id),
      lab_record:lab_scientists(id, department_id),
      radiologist_record:radiologists(id, department_id),
      pharmacist_record:pharmacists(id, department_id)
    `)
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.log('[Auth] Profile lookup failed:', profileError?.message);
    return null;
  }

  // Resolve department_id
  const staffRecs = [
    profile.doctor_record, profile.receptionist_record, profile.nurse_record,
    profile.lab_record, profile.radiologist_record, profile.pharmacist_record
  ];
  profile.department_id = staffRecs.find(rec => rec && (rec as any).department_id)?.department_id;

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
    return { error: NextResponse.json({ message: 'Not authorized' }, { status: 401 }), profile: null, supabase: null };
  }

  // Create a request-scoped Supabase client that uses the user's own token.
  // This ensures RLS is respected even if supabaseAdmin is not available.
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const supabaseClient = (token && supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false }
      })
    : (supabaseAdmin || supabase);

  if (roles) {
    const normUserRole = normalizeRole(profile.role);
    const isAuthorized = roles.some(requiredRole => {
      // 1. If route requires "Platform Admin" OR "Admin", allow platform admin variants
      if (requiredRole === 'Platform Admin' || requiredRole === 'Admin') {
        if (isPlatformAdmin(profile.role)) return true;
      }
      
      // 2. Otherwise do a normalized comparison
      return normalizeRole(requiredRole) === normUserRole;
    });

    if (!isAuthorized) {
      return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }), profile: null, supabase: null };
    }
  }

  // Multi-tenant Resolution for Super Admin
  // If user is platform admin, resolve the site they are currently managing 
  if (isPlatformAdmin(profile.role)) {
    const url = new URL(request.url);
    const host = request.headers.get('host') || '';
    const slug = url.searchParams.get('slug') || request.headers.get('x-hospital-slug');
    
    // DEBUG: Log the context we are seeing
    console.log(`[Auth Resolving] User: ${profile.email}, Role: ${profile.role}, Slug: ${slug}, Host: ${host}`);

    if (slug || host) {
      // Resolve hospital ID
      // We use supabaseAdmin if available to bypass RLS during resolution, 
      // otherwise fallback to our request-scoped client (which now has is_platform_admin RLS support)
      const query = (supabaseAdmin || supabaseClient).from('hospitals').select('id, slug');
      
      if (slug) {
        query.eq('slug', slug);
      } else if (host && !host.includes('localhost') && !host.includes('vercel.app')) {
        // Only try custom domain resolution on non-local/non-preview domains
        query.eq('custom_domain', host);
      } else {
        // Fallback for local dev if slug is missing but we're on a hospital route
        // This is a safety net
      }

      const { data: hosp, error: resolveError } = await query.maybeSingle();

      if (resolveError) {
        console.error('[Auth Resolve Error]:', resolveError.message);
      }

      if (hosp) {
        console.log(`[Auth Resolved] Hospital: ${hosp.slug}, ID: ${hosp.id}`);
        // Temporarily assign this hospital_id to the profile so all downstream 
        // filters like .eq('hospital_id', profile.hospital_id) just work.
        profile.hospital_id = hosp.id;
      } else {
        console.log(`[Auth Resolve] No hospital matched slug: ${slug} or host: ${host}`);
      }
    }
  }

  return { error: null, profile, supabase: supabaseClient };
}
