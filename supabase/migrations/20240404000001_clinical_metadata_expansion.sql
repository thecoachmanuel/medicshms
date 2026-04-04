-- Migration: Clinical Laboratory Metadata Expansion
-- Description: Adds specimen types, priority levels, and patient instructions to clinical_requests.

-- 1. Add Robust Clinical Columns
ALTER TABLE public.clinical_requests
ADD COLUMN IF NOT EXISTS specimen_type TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Routine' CHECK (priority IN ('Routine', 'Urgent', 'Stat')),
ADD COLUMN IF NOT EXISTS patient_preparation TEXT,
ADD COLUMN IF NOT EXISTS collection_instructions TEXT;

-- 2. Comment on Columns for Clarity
COMMENT ON COLUMN public.clinical_requests.specimen_type IS 'The biological material sampled (e.g., Venous Blood, Mid-stream Urine, Nasopharyngeal Swab).';
COMMENT ON COLUMN public.clinical_requests.priority IS 'Clinical urgency of the request. Stat tests should be prioritized.';
COMMENT ON COLUMN public.clinical_requests.patient_preparation IS 'Instructions provided to the patient before sampling (e.g., 12-hour fasting, NPO).';
COMMENT ON COLUMN public.clinical_requests.collection_instructions IS 'Specific technical instructions for the specimen collection process.';
