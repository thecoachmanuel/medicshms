-- Migration: Add notes, prescriptions and universal profile photos
-- 1. Add columns to public_appointments for medical records
ALTER TABLE public.public_appointments 
ADD COLUMN IF NOT EXISTS doctor_notes TEXT,
ADD COLUMN IF NOT EXISTS prescription TEXT;

-- 2. Add profile_photo to profiles table for universal avatar support
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- 3. (Optional) Sync existing profile photos to the new profiles table
-- Doctors
UPDATE public.profiles p
SET profile_photo = d.profile_photo
FROM public.doctors d
WHERE d.user_id = p.id AND d.profile_photo IS NOT NULL AND p.profile_photo IS NULL;

-- Receptionists
UPDATE public.profiles p
SET profile_photo = r.profile_photo
FROM public.receptionists r
WHERE r.user_id = p.id AND r.profile_photo IS NOT NULL AND p.profile_photo IS NULL;

-- Admins
UPDATE public.profiles p
SET profile_photo = a.profile_photo
FROM public.admins a
WHERE a.user_id = p.id AND a.profile_photo IS NOT NULL AND p.profile_photo IS NULL;
