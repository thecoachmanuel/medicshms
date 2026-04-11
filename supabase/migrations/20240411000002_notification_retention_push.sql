-- Migration: Notification Retention & Push Subscriptions
-- Description: Adds push notification support and an automated 30-day cleanup policy.

-- 1. Create Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "manage_own_push_subscriptions" ON public.push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 3. Cleanup Function for Old Notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 4. Enable pg_cron and Schedule Cleanup (Requires superuser/extensions schema)
-- NOTE: In local environments this might fail, but it's standard for Supabase deployments.
DO $$ 
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'pg_cron extension could not be enabled. Manual cleanup will be required.';
END $$;

-- Schedule the cleanup to run every day at midnight (UTC)
SELECT cron.schedule('delete-old-notifications', '0 0 * * *', 'SELECT public.cleanup_old_notifications()');
-- Note: Re-running this might fail if schedule exists, so we use a safe approach
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('delete-old-notifications');
        PERFORM cron.schedule('delete-old-notifications', '0 0 * * *', 'SELECT public.cleanup_old_notifications()');
    END IF;
END $$;
