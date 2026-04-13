-- Migration: Add department_id to receptionists table
-- Description: Enables receptionists to be assigned to specific clinical units for restricted access.

ALTER TABLE public.receptionists 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_receptionists_department_id ON public.receptionists(department_id);

-- Update RLS to ensure hospital_id is still primary context
-- (Existing policies on receptionists usually handle this, but explicit check is good)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'receptionists' AND policyname = 'tenant_isolation_policy'
    ) THEN
        CREATE POLICY "tenant_isolation_policy" ON public.receptionists
        FOR ALL TO authenticated
        USING (hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid()) OR is_platform_admin());
    END IF;
END $$;
