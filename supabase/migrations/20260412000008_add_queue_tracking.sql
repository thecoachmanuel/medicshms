-- Migration: Add Queue Tracking to Appointments
-- Added: 2026-04-12

ALTER TABLE public.public_appointments 
    ADD COLUMN IF NOT EXISTS called_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS is_calling BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS calling_station TEXT;

-- Create an index for faster queue polling
CREATE INDEX IF NOT EXISTS idx_appointments_queue ON public.public_appointments (hospital_id, department, called_at DESC) 
    WHERE is_calling = true;
