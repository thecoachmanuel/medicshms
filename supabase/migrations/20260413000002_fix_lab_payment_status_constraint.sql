-- Migration: Fix Laboratory Payment Status Constraint
-- Description: Adds 'Billed' to the clinical_requests_payment_status_check constraint to allow billing integration.

-- 1. Drop existing constraint
ALTER TABLE public.clinical_requests 
DROP CONSTRAINT IF EXISTS clinical_requests_payment_status_check;

-- 2. Re-create constraint with 'Billed' included
ALTER TABLE public.clinical_requests 
ADD CONSTRAINT clinical_requests_payment_status_check 
CHECK (payment_status IN ('Pending', 'Billed', 'Paid', 'Partial', 'Cancelled'));

-- 3. Comment on migration
COMMENT ON TABLE public.clinical_requests IS 'Updated payment_status constraint to include Billed state for automated invoicing.';
