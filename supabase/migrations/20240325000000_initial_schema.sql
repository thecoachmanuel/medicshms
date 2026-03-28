-- Initial Schema for HMS Supabase Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Base for all users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Doctor', 'Receptionist', 'Patient')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    is_active BOOLEAN DEFAULT true,
    default_consultation_fee NUMERIC DEFAULT 0,
    services JSONB DEFAULT '[]'::jsonb,
    contact JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    additional_department_ids UUID[] DEFAULT '{}',
    qualifications TEXT,
    experience TEXT,
    fees NUMERIC DEFAULT 0,
    available_slots JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    gender TEXT,
    date_of_birth DATE,
    medical_council_id TEXT,
    profile_photo TEXT,
    digital_signature TEXT,
    short_bio TEXT,
    detailed_biography TEXT,
    special_interests TEXT,
    featured_treatments JSONB DEFAULT '[]'::jsonb,
    patient_testimonials JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Receptionists Table
CREATE TABLE IF NOT EXISTS public.receptionists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    profile_photo TEXT,
    gender TEXT,
    date_of_birth DATE,
    shift TEXT,
    joining_date DATE,
    experience TEXT,
    education_level TEXT,
    id_proof_type TEXT,
    id_proof_number TEXT,
    id_proof_document TEXT,
    digital_signature TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    profile_photo TEXT,
    digital_signature TEXT,
    gender TEXT,
    date_of_birth DATE,
    joining_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Public Appointments Table
CREATE TABLE IF NOT EXISTS public.public_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    patient_id TEXT,
    appointment_id TEXT UNIQUE,
    email_address TEXT,
    mobile_number TEXT NOT NULL,
    gender TEXT,
    date_of_birth DATE,
    age INTEGER,
    age_months INTEGER,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    department TEXT,
    visit_type TEXT,
    reason_for_visit TEXT,
    primary_concern TEXT,
    known_allergies BOOLEAN DEFAULT false,
    allergies_details TEXT,
    existing_conditions TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_number TEXT,
    appointment_status TEXT DEFAULT 'Pending' CHECK (appointment_status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
    doctor_assigned_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    source TEXT DEFAULT 'Website',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    public_appointment_id UUID REFERENCES public.public_appointments(id) ON DELETE CASCADE,
    bill_number TEXT UNIQUE NOT NULL,
    services JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    round_off NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    notes TEXT,
    generated_by JSONB DEFAULT '{}'::jsonb,
    generated_by_signature TEXT,
    payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Partial', 'Cancelled')),
    payment_method TEXT,
    transaction_id TEXT,
    paid_amount NUMERIC DEFAULT 0,
    due_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    issue_type TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    priority INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    target_audience TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Site Updates (Banners)
CREATE TABLE IF NOT EXISTS public.site_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    link_text TEXT,
    link_url TEXT,
    background_color TEXT,
    text_color TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'departments', 'doctors', 'receptionists', 'admins', 'public_appointments', 'bills', 'support_tickets', 'announcements', 'site_updates')
    LOOP
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();', t);
    END LOOP;
END;
$$;
