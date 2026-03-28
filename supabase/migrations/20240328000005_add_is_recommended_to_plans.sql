-- Migration: Add is_recommended to subscription_plans
-- Description: Adds a flag to highlight specific plans on the landing page

ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;

-- Update 'Standard Hospital' to be recommended by default
UPDATE public.subscription_plans 
SET is_recommended = true 
WHERE slug = 'standard';
