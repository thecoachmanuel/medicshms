-- Migration: Add Clinical Unit (Department/Unit) to Staff Roles
-- Description: Adds department_id to nurses, lab_scientists, pharmacists, and radiologists tables.
-- Also ensures unified RLS for Super Admin.

-- 1. Add department_id to specialized staff tables
ALTER TABLE public.nurses ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.lab_scientists ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.pharmacists ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.radiologists ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 2. Update RLS policies for these tables (if they exist) to be consistent with the Super Admin helper
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('nurses', 'lab_scientists', 'pharmacists', 'radiologists')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.%I', t);
        EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (
                hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())
                OR 
                is_platform_admin()
            )
            WITH CHECK (
                hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())
                OR 
                is_platform_admin()
            )', t);
    END LOOP;
END $$;
