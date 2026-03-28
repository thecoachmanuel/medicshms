-- Migration: Add missing search and identification columns to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS patient_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email_address TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_patients_mobile ON public.patients(mobile_number);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON public.patients(patient_id);
