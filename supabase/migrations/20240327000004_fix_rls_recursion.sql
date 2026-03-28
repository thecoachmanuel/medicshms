-- Fix for RLS Infinite Recursion
-- This script adds helper functions to safely retrieve user role and hospital_id without recursion.

-- 1. Helper function to get the current user's role safely
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Helper function to get the current user's hospital_id safely
CREATE OR REPLACE FUNCTION public.get_auth_hospital_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT hospital_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Update RLS policies for all tables to use these helpers
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
        -- Policy: Users can only see data from their own hospital or all if platform_admin
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.%I', t);
        EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (
                hospital_id = public.get_auth_hospital_id()
                OR 
                public.get_auth_role() = ''platform_admin''
            )', t);
    END LOOP;
END $$;

-- Special case for profiles table (needs to allow self-access even if hospital_id is null)
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.profiles;
CREATE POLICY "profiles_tenant_isolation" ON public.profiles
FOR ALL TO authenticated
USING (
    id = auth.uid() 
    OR 
    public.get_auth_role() = 'platform_admin'
    OR
    hospital_id = public.get_auth_hospital_id()
);

-- Special case for hospitals table
DROP POLICY IF EXISTS "platform_admin_all_hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "hospital_read_own" ON public.hospitals;

CREATE POLICY "platform_admin_manage_all_hospitals" ON public.hospitals
FOR ALL TO authenticated
USING (public.get_auth_role() = 'platform_admin');

CREATE POLICY "hospital_read_own_identity" ON public.hospitals
FOR SELECT TO authenticated
USING (id = public.get_auth_hospital_id());
