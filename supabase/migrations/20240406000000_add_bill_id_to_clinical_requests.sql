-- Migration: Link Clinical Requests to Bills
-- Description: Adds a bill_id column to the clinical_requests table to track generated invoices for each investigation.

-- 1. Add bill_id column
ALTER TABLE public.clinical_requests
ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL;

-- 2. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_clinical_requests_bill_id ON public.clinical_requests(bill_id);

-- 3. Comment on column
COMMENT ON COLUMN public.clinical_requests.bill_id IS 'The ID of the bill generated for this specific laboratory or radiology request.';
