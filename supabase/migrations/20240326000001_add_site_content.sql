-- Migration: Add site_content table for CMS functionality
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path TEXT NOT NULL, -- e.g., 'home', 'about', 'contact'
    section_key TEXT NOT NULL, -- e.g., 'hero', 'stats', 'services'
    content JSONB NOT NULL, -- stores the structured data for that section
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(page_path, section_key)
);

-- RLS Policies
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to site_content" 
ON public.site_content FOR SELECT 
USING (true);

CREATE POLICY "Allow admin to manage site_content" 
ON public.site_content FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
    )
);

-- Seed initial content for Home Page
INSERT INTO public.site_content (page_path, section_key, content)
VALUES 
('home', 'hero', '{
    "title": "Compassionate Care, Advanced Technology.",
    "description": "We provide world-class medical services with a touch of humanity. Manage your health journey seamlessly with our integrated hospital ecosystem.",
    "button_primary": "Book Consultation",
    "button_secondary": "Portal Login",
    "image_url": "/hospital_hero.png"
}'),
('home', 'stats', '[
    {"label": "Specialist Doctors", "value": "150+"},
    {"label": "Patient Recovered", "value": "45k+"},
    {"label": "Success Rate", "value": "98%"},
    {"label": "Years Experience", "value": "25+"}
]'),
('contact', 'info', '{
    "email": "contact@medicshms.com",
    "phone": "+1 (800) 123-4567",
    "address": "123 Health Ave, Medical District, NY 10001",
    "emergency": "+1 (800) 999-9999"
}')
ON CONFLICT (page_path, section_key) DO NOTHING;
