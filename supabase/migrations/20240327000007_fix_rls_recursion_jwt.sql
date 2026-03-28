-- Migration: Fix RLS Recursion (JWT Edition)
-- Description: Replaces table-querying helpers with JWT-based helpers to avoid infinite recursion.

-- 1. Helper function to get the current user's role from JWT (STABLE, non-recursive)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role')::text;
$$;

-- 2. Helper function to get the current user's hospital_id from JWT (NO RECURSION)
CREATE OR REPLACE FUNCTION public.get_auth_hospital_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'hospital_id')::uuid;
$$;

-- 3. Utility for platform admin check
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'platform_admin';
$$;

-- 3. Update profiles policy to be safe
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON public.profiles;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_tenant_access" ON public.profiles;
DROP POLICY IF EXISTS "platform_admin_access_all_profiles" ON public.profiles;

-- Base case: You can always see/edit yourself
CREATE POLICY "profiles_self_access" ON public.profiles
    FOR ALL TO authenticated
    USING (id = auth.uid());

-- Admin/Staff can see others in the same hospital
-- Using the SECURITY DEFINER helper to avoid RLS recursion
CREATE POLICY "profiles_tenant_access" ON public.profiles
    FOR SELECT TO authenticated
    USING (hospital_id = public.get_auth_hospital_id());

-- Super Admin can see everyone
CREATE POLICY "platform_admin_access_all_profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_platform_admin());

-- 4. Update other table policies to use is_platform_admin()
-- This is safer than get_auth_role() = 'platform_admin'
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('departments', 'doctors', 'receptionists', 'admins', 'patients', 'public_appointments', 'bills', 'support_tickets', 'announcements', 'site_updates', 'services', 'invoice_templates', 'slot_defaults', 'slot_configs', 'site_settings', 'site_content', 'contact_messages')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.%I', t);
        EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (
                hospital_id = public.get_auth_hospital_id()
                OR 
                public.is_platform_admin()
            )', t);
    END LOOP;
END $$;

-- 5. Special case for hospitals table
DROP POLICY IF EXISTS "platform_admin_manage_all_hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "hospital_read_own_identity" ON public.hospitals;

CREATE POLICY "platform_admin_manage_all_hospitals" ON public.hospitals
FOR ALL TO authenticated
USING (public.is_platform_admin());

CREATE POLICY "hospital_read_own_identity" ON public.hospitals
FOR SELECT TO authenticated
USING (id = public.get_auth_hospital_id());
