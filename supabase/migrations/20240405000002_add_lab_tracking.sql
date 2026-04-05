-- Migration: Add Lab Tracking and Metadata Persistence
-- Description: Adds lab_number, hospital_details, and unit_name to clinical_requests for enhanced traceability and reporting.

-- 1. Add New Columns to clinical_requests
ALTER TABLE public.clinical_requests
ADD COLUMN IF NOT EXISTS lab_number TEXT,
ADD COLUMN IF NOT EXISTS hospital_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS unit_name TEXT;

-- 2. Add Comments for Clinical Traceability
COMMENT ON COLUMN public.clinical_requests.lab_number IS 'Laboratory Accession Number for specimen tracking.';
COMMENT ON COLUMN public.clinical_requests.hospital_details IS 'Snapshot of hospital branding (logo, name, etc.) at the time of result authorization.';
COMMENT ON COLUMN public.clinical_requests.unit_name IS 'The specific diagnostic department or unit that performed the analysis.';

-- 3. Add Index for Date Filtering (requested_at is already indexed or frequently used)
CREATE INDEX IF NOT EXISTS idx_clinical_requests_requested_at ON public.clinical_requests (requested_at);
CREATE INDEX IF NOT EXISTS idx_clinical_requests_lab_number ON public.clinical_requests (lab_number);
