-- Patch Migration 2: Fix missing columns in profiles and role-specific tables

-- 1. Profiles
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 2. Doctors
ALTER TABLE public.doctors 
    ADD COLUMN IF NOT EXISTS qualifications TEXT,
    ADD COLUMN IF NOT EXISTS experience TEXT,
    ADD COLUMN IF NOT EXISTS fees NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS available_slots JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS medical_council_id TEXT,
    ADD COLUMN IF NOT EXISTS profile_photo TEXT,
    ADD COLUMN IF NOT EXISTS digital_signature TEXT,
    ADD COLUMN IF NOT EXISTS short_bio TEXT,
    ADD COLUMN IF NOT EXISTS detailed_biography TEXT,
    ADD COLUMN IF NOT EXISTS special_interests TEXT,
    ADD COLUMN IF NOT EXISTS featured_treatments JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS patient_testimonials JSONB DEFAULT '[]'::jsonb;

-- 3. Receptionists
ALTER TABLE public.receptionists
    ADD COLUMN IF NOT EXISTS profile_photo TEXT,
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS shift TEXT,
    ADD COLUMN IF NOT EXISTS joining_date DATE,
    ADD COLUMN IF NOT EXISTS experience TEXT,
    ADD COLUMN IF NOT EXISTS education_level TEXT,
    ADD COLUMN IF NOT EXISTS id_proof_type TEXT,
    ADD COLUMN IF NOT EXISTS id_proof_number TEXT,
    ADD COLUMN IF NOT EXISTS id_proof_document TEXT,
    ADD COLUMN IF NOT EXISTS digital_signature TEXT;

-- 4. Admins
ALTER TABLE public.admins
    ADD COLUMN IF NOT EXISTS profile_photo TEXT,
    ADD COLUMN IF NOT EXISTS digital_signature TEXT,
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS joining_date DATE;

-- 5. Announcements
ALTER TABLE public.announcements
    ADD COLUMN IF NOT EXISTS message TEXT,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS target_audience TEXT,
    ADD COLUMN IF NOT EXISTS icon TEXT,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- 6. Site Updates
ALTER TABLE public.site_updates
    ADD COLUMN IF NOT EXISTS link_text TEXT,
    ADD COLUMN IF NOT EXISTS link_url TEXT,
    ADD COLUMN IF NOT EXISTS background_color TEXT,
    ADD COLUMN IF NOT EXISTS text_color TEXT,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- 7. Support Tickets
ALTER TABLE public.support_tickets
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.profiles(id);
