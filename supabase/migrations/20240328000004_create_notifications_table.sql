-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50), -- Option to target by role (e.g., 'Admin', 'Doctor')
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    action_url TEXT, -- Link to the related resource (e.g., /admin/appointments/ID)
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
-- 1. Users can see notifications specifically for them (by user_id)
CREATE POLICY "Users can see own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can see notifications for their role within their hospital
CREATE POLICY "Users can see role-based notifications" 
ON public.notifications FOR SELECT 
USING (
    hospital_id IN (SELECT id FROM public.hospitals WHERE id = notifications.hospital_id) AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- 3. Super admins can see all notifications (optional, but good for debugging)
CREATE POLICY "Super admins can see all notifications" 
ON public.notifications FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'platform_admin'
    )
);

-- 4. Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_hospital_id_role ON public.notifications(hospital_id, role);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
