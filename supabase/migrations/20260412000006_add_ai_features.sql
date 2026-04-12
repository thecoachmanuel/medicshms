-- Create TODOs table
CREATE TABLE public.todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    due_date TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'Medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create Hospital Events table
CREATE TABLE public.hospital_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type TEXT DEFAULT 'General',-- e.g., Clinical, Administrative, Holiday
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_events ENABLE ROW LEVEL SECURITY;

-- Policies for TODOS
CREATE POLICY "Users can manage their own todos"
    ON public.todos FOR ALL
    USING (auth.uid() = user_id);

-- Policies for Hospital Events
CREATE POLICY "Hospital users can view events"
    ON public.hospital_events FOR SELECT
    USING (hospital_id IN (SELECT hospital_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage hospital events"
    ON public.hospital_events FOR ALL
    USING (hospital_id IN (SELECT hospital_id FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));
