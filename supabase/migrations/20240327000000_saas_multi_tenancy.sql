-- Migration: SaaS Multi-Tenancy Architecture
-- Description: Adds hospitals table and scopes all existing data to a hospital_id.

-- 1. Create Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'onboarding')),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired')),
    trial_start_date TIMESTAMPTZ DEFAULT now(),
    trial_end_date TIMESTAMPTZ DEFAULT now() + interval '30 days',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on hospitals
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- 2. Create a "Default Hospital" for existing data
INSERT INTO public.hospitals (name, slug, email, status, subscription_status)
VALUES ('Default Hospital', 'default', 'admin@medicshms.com', 'active', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Get the ID of the default hospital
DO $$
DECLARE
    default_hospital_id UUID;
BEGIN
    SELECT id INTO default_hospital_id FROM public.hospitals WHERE slug = 'default';

    -- 3. Update Profiles: Add hospital_id and platform_admin role
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id);
    
    -- Update existing profiles to the default hospital
    UPDATE public.profiles SET hospital_id = default_hospital_id WHERE hospital_id IS NULL;

    -- Update role check to include platform_admin and clinical roles
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('Admin', 'Doctor', 'Receptionist', 'Patient', 'platform_admin', 'Nurse', 'Lab Scientist', 'Pharmacist', 'Radiologist'));

    -- 4. Scope all other tables to hospital_id
    -- Table list: departments, doctors, receptionists, admins, patients, public_appointments, bills, support_tickets, announcements, site_updates, services, invoice_templates, slot_defaults, slot_configs, site_settings, site_content, contact_messages
    
    -- Function to add hospital_id safely
    -- Usage: PERFORM add_hospital_id_to_table('table_name', default_hospital_id);
END $$;

-- Helper to add hospital_id to many tables
DO $$
DECLARE
    t text;
    default_hospital_id UUID;
BEGIN
    SELECT id INTO default_hospital_id FROM public.hospitals WHERE slug = 'default';
    
    -- Cleanup site_content duplicates before update to avoid 23505 unique constraint violation
    -- This happens if the user re-runs the migration or already has default-hospital content seeded.
    DELETE FROM public.site_content t1
    WHERE t1.hospital_id IS NULL
    AND EXISTS (
        SELECT 1 FROM public.site_content t2
        WHERE t2.hospital_id = default_hospital_id
        AND t2.page_path = t1.page_path
        AND t2.section_key = t1.section_key
    );

    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('departments', 'doctors', 'receptionists', 'admins', 'patients', 'public_appointments', 'bills', 'support_tickets', 'announcements', 'site_updates', 'services', 'invoice_templates', 'slot_defaults', 'slot_configs', 'site_settings', 'site_content', 'contact_messages')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) DEFAULT %L', t, default_hospital_id);
        EXECUTE format('UPDATE public.%I SET hospital_id = %L WHERE hospital_id IS NULL', t, default_hospital_id);
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN hospital_id SET NOT NULL', t);
    END LOOP;
END $$;

-- 5. RLS Policies for strict data isolation
-- We need to drop existing policies first or update them to include hospital_id check

-- Add helper functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_auth_hospital_id()
RETURNS UUID AS $$
    SELECT hospital_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('departments', 'doctors', 'receptionists', 'admins', 'patients', 'public_appointments', 'bills', 'support_tickets', 'announcements', 'site_updates', 'services', 'invoice_templates', 'slot_defaults', 'slot_configs', 'site_settings', 'site_content', 'contact_messages')
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        
        -- Policy: Users can only see data from their own hospital
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.%I', t);
        EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (
                hospital_id = get_auth_hospital_id()
                OR 
                get_auth_role() = ''platform_admin''
            )', t);
    END LOOP;
END $$;

-- Specific policies for profiles table to avoid infinite recursion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_tenant_isolation_policy" ON public.profiles;
CREATE POLICY "profiles_tenant_isolation_policy" ON public.profiles
    FOR ALL TO authenticated
    USING (
        id = auth.uid()
        OR 
        (hospital_id = get_auth_hospital_id() AND get_auth_role() IN ('Admin', 'platform_admin'))
    );

-- Special policy for public access (appointments, site settings, content)
-- These need to be filterable by hospital_id provided in the query
DROP POLICY IF EXISTS "public_read_isolation" ON public.site_settings;
CREATE POLICY "public_read_isolation" ON public.site_settings FOR SELECT USING (true); -- Filtered in code

DROP POLICY IF EXISTS "public_content_isolation" ON public.site_content;
CREATE POLICY "public_content_isolation" ON public.site_content FOR SELECT USING (true); -- Filtered in code

-- 6. Super Admin Policies
DROP POLICY IF EXISTS "platform_admin_all_hospitals" ON public.hospitals;
CREATE POLICY "platform_admin_all_hospitals" ON public.hospitals
    FOR ALL TO authenticated
    USING (get_auth_role() = 'platform_admin');

DROP POLICY IF EXISTS "hospital_read_own" ON public.hospitals;
CREATE POLICY "hospital_read_own" ON public.hospitals
    FOR SELECT TO authenticated
    USING (id = get_auth_hospital_id());

-- Trigger for updated_at on hospitals
DROP TRIGGER IF EXISTS set_updated_at_hospitals ON public.hospitals;
CREATE TRIGGER set_updated_at_hospitals BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
