-- Migration: Fix RLS policies for site_settings to allow INSERT and DELETE for Admins

-- 1. Drop existing specific policy if it exists (to avoid duplicates, though CREATE POLICY usually handles it)
DROP POLICY IF EXISTS "Allow admin to update site_settings" ON public.site_settings;

-- 2. Create a comprehensive ALL policy for Admins
CREATE POLICY "Allow admin to manage site_settings" 
ON public.site_settings FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
);

-- 3. Ensure public read access remains
DROP POLICY IF EXISTS "Allow public read access to site_settings" ON public.site_settings;
CREATE POLICY "Allow public read access to site_settings" 
ON public.site_settings FOR SELECT 
USING (true);
