-- Migration: Add completed_at to public_appointments
-- Description: Adds a timestamp column to track exactly when a clinical session was finalized.

ALTER TABLE public.public_appointments 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- (Optional) Update existing 'Completed' appointments to use their updated_at as a fallback
UPDATE public.public_appointments 
SET completed_at = updated_at 
WHERE appointment_status = 'Completed' AND completed_at IS NULL;
