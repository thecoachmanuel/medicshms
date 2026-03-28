-- Migration: Add contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, read, replied, archived
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (from contact form)
CREATE POLICY "Allow public to insert contact messages" 
ON public.contact_messages FOR INSERT 
WITH CHECK (true);

-- Allow admins to read/update/delete
CREATE POLICY "Allow admins to manage contact messages" 
ON public.contact_messages FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
);
