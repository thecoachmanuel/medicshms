-- Migration: Add site_settings table for branding and global configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_name TEXT DEFAULT 'MedicsHMS',
    hospital_short_name TEXT DEFAULT 'ML Hospital',
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#10b981', -- default emerald-500
    secondary_color TEXT DEFAULT '#0f172a', -- default slate-900
    contact_email TEXT DEFAULT 'contact@medicshms.com',
    contact_phone TEXT DEFAULT '+1 (800) 123-4567',
    address TEXT DEFAULT '123 Health Ave, Medical District, NY 10001',
    maintenance_mode BOOLEAN DEFAULT false,
    sms_notifications BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings if not exists
INSERT INTO public.site_settings (hospital_name, hospital_short_name)
SELECT 'MedicsHMS', 'ML Hospital'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

-- RLS Policies
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to site_settings" 
ON public.site_settings FOR SELECT 
USING (true);

CREATE POLICY "Allow admin to update site_settings" 
ON public.site_settings FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
);
