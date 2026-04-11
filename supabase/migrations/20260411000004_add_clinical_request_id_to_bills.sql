-- Migration: Align Bills Schema with Clinical Requests
-- Description: Adds clinical_request_id to bills for standalone investigation tracking.

-- 1. Add clinical_request_id to bills
ALTER TABLE public.bills
ADD COLUMN IF NOT EXISTS clinical_request_id UUID REFERENCES public.clinical_requests(id) ON DELETE SET NULL;

-- 2. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_bills_clinical_request_id ON public.bills(clinical_request_id);

-- 3. Comment on column
COMMENT ON COLUMN public.bills.clinical_request_id IS 'Link to the clinical request (Lab/Radiology/Pharmacy) for which this standalone bill was generated.';
