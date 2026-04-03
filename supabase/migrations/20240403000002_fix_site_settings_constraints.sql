-- Migration: Fix site_settings constraints and RLS for Platform Admin
-- Description: Makes hospital_id nullable for global settings and updates RLS for Super Admin access.

-- 1. Drop NOT NULL constraint from hospital_id
ALTER TABLE public.site_settings ALTER COLUMN hospital_id DROP NOT NULL;

-- 2. Add a unique constraint for the global settings record (where hospital_id IS NULL)
-- This ensures only one set of platform-wide settings exists.
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_global_idx ON public.site_settings (hospital_id) WHERE hospital_id IS NULL;

-- 3. Update RLS policies
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "public_read_isolation" ON public.site_settings;
DROP POLICY IF EXISTS "admin_manage_isolation" ON public.site_settings;
DROP POLICY IF EXISTS "platform_admin_manage_all" ON public.site_settings;
DROP POLICY IF EXISTS "Allow public read access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin to update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "public_read_site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "manage_site_settings" ON public.site_settings;

-- A. Public Read Policy (Essential for branding before login)
CREATE POLICY "public_read_site_settings" 
ON public.site_settings FOR SELECT 
USING (true);

-- B. Unified Management Policy
-- Allows:
-- 1. Hospital Admins to manage their own hospital's settings
-- 2. Platform/Super Admins to manage EVERYTHING (including global settings)
CREATE POLICY "manage_site_settings" 
ON public.site_settings FOR ALL 
TO authenticated 
USING (
    hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())
    OR 
    is_platform_admin()
)
WITH CHECK (
    hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())
    OR 
    is_platform_admin()
);
