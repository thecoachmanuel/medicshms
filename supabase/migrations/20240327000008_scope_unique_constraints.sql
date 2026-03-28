-- Migration: Scope unique constraints to hospital_id
-- Description: Transition global unique constraints to composite unique constraints including hospital_id for multi-tenancy.

-- 1. Departments Slug
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_slug_key;
ALTER TABLE public.departments ADD CONSTRAINT departments_hospital_slug_unique UNIQUE (hospital_id, slug);

-- 2. Public Appointments ID
ALTER TABLE public.public_appointments DROP CONSTRAINT IF EXISTS public_appointments_appointment_id_key;
ALTER TABLE public.public_appointments ADD CONSTRAINT appointments_hospital_id_unique UNIQUE (hospital_id, appointment_id);

-- 3. Bills Number
ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_bill_number_key;
ALTER TABLE public.bills ADD CONSTRAINT bills_hospital_number_unique UNIQUE (hospital_id, bill_number);
