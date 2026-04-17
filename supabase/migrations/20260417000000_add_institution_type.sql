-- Migration: Add institution_type to hospitals
-- Description: Supports multiple types of healthcare institutions

ALTER TABLE public.hospitals 
ADD COLUMN IF NOT EXISTS institution_type TEXT DEFAULT 'hospital' 
CHECK (institution_type IN ('hospital', 'dental_clinic', 'diagnostic_center', 'eye_clinic'));

-- Also add to site_settings for easier access in UI
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS institution_type TEXT DEFAULT 'hospital';

-- Update existing data (optional, as default is 'hospital')
UPDATE public.hospitals SET institution_type = 'hospital' WHERE institution_type IS NULL;
UPDATE public.site_settings SET institution_type = 'hospital' WHERE institution_type IS NULL;
