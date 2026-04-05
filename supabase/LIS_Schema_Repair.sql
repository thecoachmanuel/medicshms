-- LIS Schema Repair Script
-- Purpose: Ensures all Laboratory Information System tables and relationships exist correctly.

-- 1. Ensure Laboratory Units Table
CREATE TABLE IF NOT EXISTS public.lab_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure Scientist Unit Assignments
CREATE TABLE IF NOT EXISTS public.lab_unit_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES public.lab_units(id) ON DELETE CASCADE,
    scientist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(unit_id, scientist_id)
);

-- 3. Ensure Laboratory Test Catalog
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

-- 4. Repair Clinical Requests Table for LIS Linkage
DO $$
BEGIN
    -- Add unit_id column and FK if not present
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_requests' AND column_name = 'unit_id') THEN
        ALTER TABLE public.clinical_requests ADD COLUMN unit_id UUID REFERENCES public.lab_units(id) ON DELETE SET NULL;
    END IF;

    -- Ensure handled_by FK to profiles exists (often missing in old schemas)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_requests' AND column_name = 'handled_by') THEN
        -- Safely drop and recreate the FK to ensure it's pointing to profiles
        ALTER TABLE public.clinical_requests DROP CONSTRAINT IF EXISTS clinical_requests_handled_by_fkey;
        ALTER TABLE public.clinical_requests ADD CONSTRAINT clinical_requests_handled_by_fkey FOREIGN KEY (handled_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Re-apply Multi-Tenant RLS for Lab Management
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
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        
        -- Drop any old policy to avoid duplicates
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.%I;', t);
        
        -- Special case: lab_unit_assignments needs unit-based lookup
        IF t = 'lab_unit_assignments' THEN
            EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.lab_unit_assignments
                FOR ALL TO authenticated 
                USING (unit_id IN (SELECT id FROM public.lab_units WHERE hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())));');
        ELSE
            -- Standard hospital-based policy for units and catalog
            EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.%I
                FOR ALL TO authenticated 
                USING (hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = ''platform_admin'');', t);
        END IF;

        -- Ensure handled_at trigger exists
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I;', t);
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();', t);
    END LOOP;
END $$;
