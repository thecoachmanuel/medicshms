-- Migration: Add suspended status to hospital subscription check
-- Description: Updates the check constraint on hospitals table to allow 'suspended' as a subscription status.

ALTER TABLE public.hospitals DROP CONSTRAINT IF EXISTS hospitals_subscription_status_check;

ALTER TABLE public.hospitals ADD CONSTRAINT hospitals_subscription_status_check 
CHECK (subscription_status IN ('trial', 'active', 'expired', 'paused', 'suspended'));

-- Ensure any existing 'inactive' status in 'status' column is handled if needed
-- (Though 'subscription_status' is our main block driver)
