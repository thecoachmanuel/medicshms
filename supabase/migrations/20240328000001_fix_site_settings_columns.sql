-- Migration: Add missing columns to site_settings table
-- Fixes: "Could not find the 'allow_public_registration' column of 'site_settings' in the schema cache"

ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS theme_color TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
ADD COLUMN IF NOT EXISTS allow_public_registration BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port TEXT,
ADD COLUMN IF NOT EXISTS smtp_user TEXT,
ADD COLUMN IF NOT EXISTS smtp_pass TEXT,
ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{}'::jsonb;

-- Re-sync schema cache notice (for server environments)
-- NOTIFY pgrst, 'reload schema';
