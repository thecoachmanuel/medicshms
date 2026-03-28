-- Migration: Add missing doctor_id and patient_id to bills table for better indexing and snapshots
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS patient_id TEXT; -- Matches the patient_id (TEXT) in public_appointments and patients

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_bills_doctor_id ON public.bills(doctor_id);
CREATE INDEX IF NOT EXISTS idx_bills_patient_id ON public.bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_bills_appointment_id ON public.bills(public_appointment_id);
