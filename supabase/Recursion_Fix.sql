-- JWT-Based Recursion Fix Script
-- Purpose: Resolves the infinite recursion (42P17) by utilizing pre-calculated JWT claims.
-- Strategy: Leverages auth.jwt() user_metadata to determine hospital and role context without querying the profiles table.

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_tenant_isolation_policy" ON public.profiles;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.lab_units;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.lab_unit_assignments;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.lab_test_catalog;

-- 2. Define High-Performance Helper Functions
-- These functions pull from the authenticated JWT session, breaking all recursion.
CREATE OR REPLACE FUNCTION public.get_auth_hospital_id()
RETURNS UUID AS $$
DECLARE
  h_id text;
BEGIN
  -- Try to get from JWT claims (user_metadata) first
  h_id := auth.jwt() -> 'user_metadata' ->> 'hospital_id';
  IF h_id IS NOT NULL THEN
    RETURN h_id::uuid;
  END IF;
  
  -- Fallback to DB lookup only if metadata is missing (SECURITY DEFINER bypasses RLS)
  RETURN (SELECT hospital_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
DECLARE
  u_role text;
BEGIN
  -- Try to get from JWT claims (user_metadata) first
  u_role := auth.jwt() -> 'user_metadata' ->> 'role';
  IF u_role IS NOT NULL THEN
    RETURN u_role;
  END IF;

  -- Fallback to DB lookup only if metadata is missing (SECURITY DEFINER bypasses RLS)
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Implement JWT-Powered Profiles Policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_tenant_isolation_policy" ON public.profiles
    FOR ALL TO authenticated
    USING (
        -- Category 1: Own Record (Always accessible)
        id = auth.uid() 
        OR 
        -- Category 2: Cross-profile lookup for Admins (Uses JWT for isolation)
        (
            hospital_id = get_auth_hospital_id()
            AND 
            get_auth_role() IN ('Admin', 'platform_admin')
        )
    );

-- 4. Re-apply Laboratory Policies using the JWT helpers
CREATE POLICY "tenant_isolation_policy" ON public.lab_units
    FOR ALL TO authenticated 
    USING (hospital_id = get_auth_hospital_id() OR get_auth_role() = 'platform_admin');

CREATE POLICY "tenant_isolation_policy" ON public.lab_unit_assignments
    FOR ALL TO authenticated 
    USING (unit_id IN (SELECT id FROM public.lab_units WHERE hospital_id = get_auth_hospital_id()));

CREATE POLICY "tenant_isolation_policy" ON public.lab_test_catalog
    FOR ALL TO authenticated 
    USING (hospital_id = get_auth_hospital_id() OR get_auth_role() = 'platform_admin');

-- 5. Atomic Schema Refresh
ANALYZE public.profiles;
ANALYZE public.lab_units;
ANALYZE public.lab_unit_assignments;
ANALYZE public.lab_test_catalog;
