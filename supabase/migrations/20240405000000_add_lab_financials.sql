-- Migration: Laboratory Financial Infrastructure
-- Description: Adds test_price, service_id, and payment_status to clinical_requests for billing integration.

-- 1. Add Financial Columns to Clinical Requests
ALTER TABLE public.clinical_requests
ADD COLUMN IF NOT EXISTS test_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';

-- 2. Add Payment Status Check Constraint
ALTER TABLE public.clinical_requests
DROP CONSTRAINT IF EXISTS clinical_requests_payment_status_check;

ALTER TABLE public.clinical_requests
ADD CONSTRAINT clinical_requests_payment_status_check 
CHECK (payment_status IN ('Pending', 'Paid', 'Partial', 'Cancelled'));

-- 3. Comment on Columns for Clarity
COMMENT ON COLUMN public.clinical_requests.test_price IS 'The unit price of the laboratory or radiology investigation at the time of request.';
COMMENT ON COLUMN public.clinical_requests.service_id IS 'Link to the master services catalog for billing synchronization.';
COMMENT ON COLUMN public.clinical_requests.payment_status IS 'Financial state of the request. Controlled by the Billing/Receptionist module.';
