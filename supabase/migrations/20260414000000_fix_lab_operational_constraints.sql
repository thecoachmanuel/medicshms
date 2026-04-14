-- Migration: Fix Laboratory Operational Constraints
-- Description: Ensures clinical_requests table constraints are fully aligned with the latest mobile-first workflow requirements.

-- 1. Synchronize Status Constraint
ALTER TABLE public.clinical_requests 
DROP CONSTRAINT IF EXISTS clinical_requests_status_check;

ALTER TABLE public.clinical_requests 
ADD CONSTRAINT clinical_requests_status_check 
CHECK (status IN ('Pending', 'Collected', 'In Progress', 'Completed', 'Cancelled', 'Billed'));

-- 2. Synchronize Payment Status Constraint
ALTER TABLE public.clinical_requests 
DROP CONSTRAINT IF EXISTS clinical_requests_payment_status_check;

ALTER TABLE public.clinical_requests 
ADD CONSTRAINT clinical_requests_payment_status_check 
CHECK (payment_status IN ('Pending', 'Billed', 'Partial', 'Paid', 'Cancelled', 'Deferred'));

-- 3. Add Index for Scientific Reporting
CREATE INDEX IF NOT EXISTS idx_clinical_requests_handled_by_status 
ON public.clinical_requests(handled_by, status);

COMMENT ON TABLE public.clinical_requests IS 'Clinical operations audit log - updated with synchronized status constraints for laboratory and radiology workflows.';
