-- Migration: Fix site_updates for global platform banners and public access
-- Description: Makes hospital_id nullable and allows public read access.

-- 1. Make hospital_id nullable in site_updates to allow platform-wide banners (hospital_id IS NULL)
ALTER TABLE public.site_updates ALTER COLUMN hospital_id DROP NOT NULL;

-- 2. Drop the restrictive authenticated-only policy
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.site_updates;
DROP POLICY IF EXISTS "tenant_isolation_policy_site_updates" ON public.site_updates;

-- 3. Create a comprehensive policy for site_updates
-- Allow anyone (including public) to read banners (they are filtered by slug/hospital_id in the API)
CREATE POLICY "public_read_site_updates" ON public.site_updates
    FOR SELECT TO public
    USING (is_active = true);

-- 4. Allow authenticated users to manage their own hospital's banners
-- And allow platform_admin to manage ALL banners (including global ones)
CREATE POLICY "manage_site_updates" ON public.site_updates
    FOR ALL TO authenticated
    USING (
        hospital_id = public.get_auth_hospital_id()
        OR 
        public.is_platform_admin()
        OR
        hospital_id IS NULL AND public.is_platform_admin()
    )
    WITH CHECK (
        hospital_id = public.get_auth_hospital_id()
        OR 
        public.is_platform_admin()
    );
