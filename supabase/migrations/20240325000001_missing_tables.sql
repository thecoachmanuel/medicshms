-- Patch Migration: Add missing tables and columns

-- 1. Patients table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    gender TEXT,
    date_of_birth DATE,
    blood_group TEXT,
    address TEXT,
    medical_history JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Services table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    price NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Invoice Templates table (singleton row, key = 'default')
CREATE TABLE IF NOT EXISTS public.invoice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL DEFAULT 'default',
    hospital_name TEXT,
    hospital_address TEXT,
    contact_number TEXT,
    email_address TEXT,
    gst_number TEXT,
    cin_number TEXT,
    website_url TEXT,
    hospital_logo TEXT,
    footer_note TEXT,
    terms_and_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Slot Defaults table (singleton row, key = 'global')
CREATE TABLE IF NOT EXISTS public.slot_defaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL DEFAULT 'global',
    max_booking_window_days INTEGER DEFAULT 20,
    default_slot_duration_minutes INTEGER DEFAULT 30,
    default_working_hours_start TEXT DEFAULT '09:00',
    default_working_hours_end TEXT DEFAULT '17:00',
    default_break_start TEXT DEFAULT '13:00',
    default_break_end TEXT DEFAULT '14:00',
    default_daily_capacity INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Slot Configs table (shared config, key = 'shared'; per-doctor config by doctor_id)
CREATE TABLE IF NOT EXISTS public.slot_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    working_days JSONB DEFAULT '[]'::jsonb,
    date_overrides JSONB DEFAULT '[]'::jsonb,
    min_advance_booking_minutes INTEGER DEFAULT 60,
    same_day_cutoff_time TEXT,
    last_modified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Fix public_appointments: add missing columns
ALTER TABLE public.public_appointments 
    ADD COLUMN IF NOT EXISTS department TEXT,
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Website',
    ADD COLUMN IF NOT EXISTS doctor_assigned_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL;

-- If doctor_assigned column exists (from initial schema run), rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'public_appointments' AND column_name = 'doctor_assigned'
    ) THEN
        ALTER TABLE public.public_appointments RENAME COLUMN doctor_assigned TO doctor_assigned_id_old;
        -- Migrate data if any
        UPDATE public.public_appointments SET doctor_assigned_id = doctor_assigned_id_old WHERE doctor_assigned_id_old IS NOT NULL;
        ALTER TABLE public.public_appointments DROP COLUMN doctor_assigned_id_old;
    END IF;
END;
$$;

-- Seed global slot defaults
INSERT INTO public.slot_defaults (key) VALUES ('global') ON CONFLICT (key) DO NOTHING;

-- Seed default invoice template
INSERT INTO public.invoice_templates (key) VALUES ('default') ON CONFLICT (key) DO NOTHING;

-- Apply updated_at triggers to new tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('patients', 'services', 'invoice_templates', 'slot_defaults', 'slot_configs')
    LOOP
        BEGIN
            EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();', t);
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- trigger already exists, skip
        END;
    END LOOP;
END;
$$;
