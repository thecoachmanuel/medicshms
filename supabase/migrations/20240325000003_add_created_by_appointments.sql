-- Migration: Add created_by to public_appointments
ALTER TABLE public.public_appointments 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
