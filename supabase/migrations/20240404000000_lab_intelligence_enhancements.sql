-- Migration: Lab Intelligence Enhancements
-- Description: Adds specimen collection tracking and biological reference range support to clinical_requests.

-- 1. Update Status Constraint
ALTER TABLE public.clinical_requests DROP CONSTRAINT IF EXISTS clinical_requests_status_check;
ALTER TABLE public.clinical_requests ADD CONSTRAINT clinical_requests_status_check 
CHECK (status IN ('Pending', 'Collected', 'In Progress', 'Completed', 'Cancelled'));

-- 2. Add New Columns for Traceability and Validation
ALTER TABLE public.clinical_requests
ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS min_range NUMERIC,
ADD COLUMN IF NOT EXISTS max_range NUMERIC,
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS unit TEXT; -- e.g. mg/dL, g/L

-- 3. Comment on Columns for Clarity
COMMENT ON COLUMN public.clinical_requests.collected_at IS 'Timestamp when the biological specimen was received in the lab.';
COMMENT ON COLUMN public.clinical_requests.min_range IS 'Minimum normal biological reference value.';
COMMENT ON COLUMN public.clinical_requests.max_range IS 'Maximum normal biological reference value.';
COMMENT ON COLUMN public.clinical_requests.is_critical IS 'Flags results that are outside the normal range and require urgent attention.';
