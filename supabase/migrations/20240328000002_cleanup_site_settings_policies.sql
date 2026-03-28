-- Migration: Cleanup and Stabilize Site Settings Policies
-- Description: Ensures strict tenant isolation and proper admin access for site_settings.

-- 1. Drop all existing potentially conflicting policies
DROP POLICY IF EXISTS "Allow public read access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin to update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.site_settings;
DROP POLICY IF EXISTS "public_read_isolation" ON public.site_settings;

-- 2. Create Public Read Policy (essential for branding before login)
CREATE POLICY "public_read_isolation" 
ON public.site_settings FOR SELECT 
USING (true);

-- 3. Create Tenant Admin Policy (Insert/Update/Delete own)
CREATE POLICY "admin_manage_isolation" 
ON public.site_settings FOR ALL 
TO authenticated 
USING (
    hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())
    AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
)
WITH CHECK (
    hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())
    AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
);

-- 4. Create Platform Admin Policy (Manage everything)
CREATE POLICY "platform_admin_manage_all" 
ON public.site_settings FOR ALL 
TO authenticated 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'platform_admin'
)
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'platform_admin'
);
