-- Migration: Enrich Lab Metadata
-- Description: Adds requested_by_name, patient_age, and patient_gender for persistent clinical records.

-- 1. Add New Columns to clinical_requests
ALTER TABLE public.clinical_requests
ADD COLUMN IF NOT EXISTS requested_by_name TEXT,
ADD COLUMN IF NOT EXISTS patient_age TEXT,
ADD COLUMN IF NOT EXISTS patient_gender TEXT;

-- 2. Add Comments for Clinical Traceability
COMMENT ON COLUMN public.clinical_requests.requested_by_name IS 'The name of the referring physician or requesting clinician.';
COMMENT ON COLUMN public.clinical_requests.patient_age IS 'Snapshot of the patient age at the moment of request.';
COMMENT ON COLUMN public.clinical_requests.patient_gender IS 'Snapshot of the patient gender at the moment of request.';
