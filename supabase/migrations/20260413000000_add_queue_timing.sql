-- Migration: Add Arrival and Triage Tracking to Appointments
-- Added: 2026-04-13

ALTER TABLE public.public_appointments 
    ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS triaged_at TIMESTAMP WITH TIME ZONE;

-- Create an index for queue management (FIFO sorting)
CREATE INDEX IF NOT EXISTS idx_appointments_queue_arrival ON public.public_appointments (hospital_id, arrived_at ASC) 
    WHERE appointment_status = 'Arrived';

CREATE INDEX IF NOT EXISTS idx_appointments_queue_triage ON public.public_appointments (hospital_id, triaged_at ASC) 
    WHERE appointment_status = 'Triaged';
