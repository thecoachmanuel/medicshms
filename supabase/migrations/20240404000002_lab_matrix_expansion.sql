-- Migration: Laboratory Matrix & Intelligent Catalog
-- Description: Adds Laboratory Units, Scientist Assignments, and a Test Catalog with auto-indexing capabilities.

-- 1. Laboratory Units Table
CREATE TABLE IF NOT EXISTS public.lab_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Scientist Unit Assignments (Junction Table)
CREATE TABLE IF NOT EXISTS public.lab_unit_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES public.lab_units(id) ON DELETE CASCADE,
    scientist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(unit_id, scientist_id)
);

-- 3. Laboratory Test Catalog
CREATE TABLE IF NOT EXISTS public.lab_test_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.lab_units(id) ON DELETE SET NULL,
    test_name TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    description TEXT,
    is_auto_created BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hospital_id, test_name)
);

-- 4. Update Clinical Requests with Unit Link
ALTER TABLE public.clinical_requests 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.lab_units(id) ON DELETE SET NULL;

-- 5. Enable RLS for Multi-tenancy
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('lab_units', 'lab_unit_assignments', 'lab_test_catalog')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        
        EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (
                hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())
                OR 
                (SELECT role FROM public.profiles WHERE id = auth.uid()) = ''platform_admin''
            );', t);

        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();', t);
    END LOOP;
END;
$$;

-- Special Case for lab_unit_assignments RLS (no direct hospital_id)
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.lab_unit_assignments;
CREATE POLICY "tenant_isolation_policy_assignments" ON public.lab_unit_assignments
FOR ALL TO authenticated
USING (
    unit_id IN (SELECT id FROM public.lab_units WHERE hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid()))
);
