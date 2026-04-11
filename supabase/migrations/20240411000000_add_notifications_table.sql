-- Migration: Add Notifications Table
-- Description: Creates the notifications table for real-time alerts across all roles.

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Specific target user
    role TEXT, -- Target role (if user_id is null, all users with this role in the hospital get it)
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'clinical', 'financial')),
    action_url TEXT, -- Link to the relevant page (e.g., /admin/billing/123)
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can see notifications specifically for them OR for their role within their hospital
DROP POLICY IF EXISTS "notifications_isolation_policy" ON public.notifications;
CREATE POLICY "notifications_isolation_policy" ON public.notifications
    FOR ALL TO authenticated
    USING (
        (user_id = auth.uid()) -- Personal
        OR 
        (hospital_id = get_auth_hospital_id() AND role = get_auth_role()) -- Role-based in same hospital
        OR
        (get_auth_role() = 'platform_admin' AND hospital_id IS NULL) -- Platform Global
    );

-- 4. Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_notifications ON public.notifications;
CREATE TRIGGER set_updated_at_notifications 
BEFORE UPDATE ON public.notifications 
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
