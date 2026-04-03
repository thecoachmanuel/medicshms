-- Migration: Universal Super Admin RLS Fix
-- Description: Updates all existing tenant isolation policies to use the is_platform_admin() helper.
-- This ensures that both platform_admin and super_admin see all tenant data.

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'profiles', 'departments', 'doctors', 'receptionists', 'admins', 
            'patients', 'public_appointments', 'bills', 'support_tickets', 
            'announcements', 'site_updates', 'services', 'invoice_templates', 
            'slot_defaults', 'slot_configs', 'site_settings', 'site_content', 
            'contact_messages'
        )
    LOOP
        -- Drop existing policy if it exists
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.%I', t);
        
        -- Create new unified policy using is_platform_admin()
        -- Note: is_platform_admin() check includes both 'platform_admin' and 'super_admin' roles
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
            
        RAISE NOTICE 'Updated RLS policy for table: %', t;
    END LOOP;
END $$;

-- Also update policies on the hospitals table for consistency
DROP POLICY IF EXISTS "platform_admin_all_hospitals" ON public.hospitals;
CREATE POLICY "platform_admin_all_hospitals" ON public.hospitals
    FOR ALL TO authenticated
    USING (is_platform_admin());

DROP POLICY IF EXISTS "hospital_read_own" ON public.hospitals;
CREATE POLICY "hospital_read_own" ON public.hospitals
    FOR SELECT TO authenticated
    USING (id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid()));
