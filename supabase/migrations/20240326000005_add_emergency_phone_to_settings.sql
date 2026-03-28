-- Migration: Add emergency_phone to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS emergency_phone TEXT DEFAULT '+1 (800) 123-4567';

-- Update existing row with default value if null
UPDATE public.site_settings 
SET emergency_phone = '+1 (800) 123-4567' 
WHERE emergency_phone IS NULL;
