-- LIS Final Infrastructure Polish (v4 - Global Security Sync)
-- Purpose: Resolves persistent 42P17 (recursion) by extending zero-recursion JWT session claims to ALL clinical tables.

-- 1. Total Policy Purge (Profiles)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. Implement the ONE and ONLY Profiles Policy (Zero-Recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_tenant_isolation_policy" ON public.profiles
    FOR ALL TO authenticated
    USING (
        id = auth.uid() 
        OR 
        (
            hospital_id = (auth.jwt() -> 'user_metadata' ->> 'hospital_id')::uuid
            AND 
            (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin', 'platform_admin', 'Doctor', 'Lab Scientist', 'Nurse', 'Radiologist', 'Pharmacist')
        )
    );

-- 3. Standardize Laboratory Units & Catalog
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.lab_units;
CREATE POLICY "tenant_isolation_policy" ON public.lab_units
    FOR ALL TO authenticated 
    USING (
        hospital_id = (auth.jwt() -> 'user_metadata' ->> 'hospital_id')::uuid 
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'platform_admin'
    );

DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.lab_test_catalog;
CREATE POLICY "tenant_isolation_policy" ON public.lab_test_catalog
    FOR ALL TO authenticated 
    USING (
        hospital_id = (auth.jwt() -> 'user_metadata' ->> 'hospital_id')::uuid 
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'platform_admin'
    );

-- 4. Global Clinical Workflow Security (Recursion Terminated)
-- Applies JWT-based isolation to all tables from the 20240401 migration
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('clinical_requests', 'patient_vitals', 'pharmacy_inventory', 'prescriptions', 'nurses', 'lab_scientists', 'pharmacists', 'radiologists', 'lab_unit_assignments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy_assignments" ON public.%I', t);

        IF t = 'lab_unit_assignments' THEN
            -- Special case for assignments (linked via unit_id)
            EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.%I 
                FOR ALL TO authenticated 
                USING (
                    unit_id IN (SELECT id FROM public.lab_units WHERE hospital_id = (auth.jwt() -> ''user_metadata'' ->> ''hospital_id'')::uuid)
                );', t);
        ELSE
            EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.%I 
                FOR ALL TO authenticated 
                USING (
                    hospital_id = (auth.jwt() -> ''user_metadata'' ->> ''hospital_id'')::uuid 
                    OR (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''platform_admin''
                );', t);
        END IF;
    END LOOP;
END $$;

-- 5. Atomic Schema Refresh
ANALYZE public.profiles;
ANALYZE public.clinical_requests;
ANALYZE public.lab_units;
ANALYZE public.lab_test_catalog;
ANALYZE public.lab_unit_assignments;

