-- Add is_payment_enabled to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS is_payment_enabled BOOLEAN DEFAULT false;
