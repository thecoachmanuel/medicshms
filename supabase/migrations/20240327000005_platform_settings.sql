-- Migration: Allow NULL hospital_id in site_settings for global platform settings
-- Also create a platform settings row

-- 1. Make hospital_id nullable in site_settings
ALTER TABLE public.site_settings ALTER COLUMN hospital_id DROP NOT NULL;

-- 2. Update RLS for site_settings to allow public read of platform settings
-- Platform settings are those where hospital_id is NULL
DROP POLICY IF EXISTS "public_read_isolation" ON public.site_settings;
CREATE POLICY "public_read_site_settings" ON public.site_settings
FOR SELECT TO public
USING (true); -- We filter by slug/id in the application code

-- 3. Create initial Platform Settings (SaaS Logo)
-- This row has hospital_id as NULL
INSERT INTO public.site_settings (
    hospital_name,
    hospital_short_name,
    logo_url,
    primary_color,
    secondary_color,
    contact_email,
    emergency_phone,
    hospital_id
)
VALUES (
    'MedicsHMS',
    'MedicsHMS',
    'https://res.cloudinary.com/dmet98v6q/image/upload/v1711280000/saas_logo.png', -- Placeholder or current default
    '#2563eb',
    '#0f172a',
    'platform@medicshms.com',
    '+1 (800) PLATFORM',
    NULL
)
ON CONFLICT DO NOTHING;
