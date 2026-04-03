-- Migration: Update is_platform_admin helper
-- Description: Supports multiple platform administrator role identifiers to fix RLS access issues.

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER -- Required to check profiles table across RLS
AS $$
  -- 1. Check JWT metadata first (fastest)
  -- 2. Fallback to direct profiles check for reliability
  SELECT 
    ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('platform_admin', 'super_admin'))
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('platform_admin', 'super_admin')
    );
$$;

-- Also update get_auth_role to be more predictable if needed, 
-- but is_platform_admin is the primary check for RLS.
