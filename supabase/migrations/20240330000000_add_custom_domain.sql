-- Migration: Add custom_domain to hospitals table
-- Description: Allows hospitals to link their own external domains.

ALTER TABLE public.hospitals 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Add comment for clarity
COMMENT ON COLUMN public.hospitals.custom_domain IS 'Custom external domain for the hospital (e.g., hospital-a.com)';
