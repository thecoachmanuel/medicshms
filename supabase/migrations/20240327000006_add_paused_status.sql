-- Migration: Add 'paused' to hospital subscription status
-- Description: Updates the check constraint on the hospitals table to allow a 'paused' status.

-- 1. Drop the existing check constraint
ALTER TABLE public.hospitals DROP CONSTRAINT IF EXISTS hospitals_subscription_status_check;

-- 2. Add the updated check constraint
ALTER TABLE public.hospitals ADD CONSTRAINT hospitals_subscription_status_check 
CHECK (subscription_status IN ('trial', 'active', 'expired', 'paused'));

-- 3. Note: The application logic in PortalLayout will need to handle the 'paused' state.
