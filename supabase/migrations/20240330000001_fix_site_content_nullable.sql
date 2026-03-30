-- Migration: Make hospital_id nullable in site_content for global platform content
-- Also update RLS to allow platform_admin to manage all content

-- 1. Drop NOT NULL constraint
ALTER TABLE public.site_content ALTER COLUMN hospital_id DROP NOT NULL;

-- 2. Ensure RLS allows platform_admin to manage all rows
-- (This was already handled by tenant_isolation_policy in saas_multi_tenancy.sql, 
-- but we verify/re-apply if needed for clarity)
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.site_content;
CREATE POLICY "tenant_isolation_policy" ON public.site_content 
FOR ALL 
TO authenticated 
USING (
    hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'platform_admin'
);
