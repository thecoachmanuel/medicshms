-- Migration: Update is_platform_admin helper
-- Description: Supports multiple platform administrator role identifiers to fix RLS access issues.

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  -- Checks if the fixed string 'platform_admin' or 'super_admin' is in the JWT
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') IN ('platform_admin', 'super_admin');
$$;

-- Also update get_auth_role to be more predictable if needed, 
-- but is_platform_admin is the primary check for RLS.
