-- Migration: Seed site_content with comprehensive defaults and add update trigger

-- 1. Create function for updating updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add trigger to site_content
DROP TRIGGER IF EXISTS set_site_content_updated_at ON public.site_content;
CREATE TRIGGER set_site_content_updated_at
    BEFORE UPDATE ON public.site_content
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Seed all current sections with defaults from the app schema
INSERT INTO public.site_content (page_path, section_key, content)
VALUES 
-- Home Page
('home', 'hero', '{
    "title": "Compassionate Care, Advanced Technology.",
    "description": "We provide world-class medical services with a touch of humanity. Manage your health journey seamlessly with our integrated hospital ecosystem.",
    "button_primary": "Book Consultation",
    "button_secondary": "Portal Login",
    "image_url": "/hospital_hero.png",
    "badge_text": "5000+ Happy Patients"
}'),
('home', 'stats', '[
    {"label": "Specialist Doctors", "value": "150+"},
    {"label": "Patient Recovered", "value": "45k+"},
    {"label": "Success Rate", "value": "98%"},
    {"label": "Years Experience", "value": "25+"}
]'),
('home', 'departments_intro', '{
    "tagline": "Our Departments",
    "title": "Comprehensive Care in Every Specialty",
    "description": "Equipped with state-of-the-art technology and led by industry experts, our departments cover every aspect of modern medicine."
}'),
('home', 'departments_list', '[
    { "name": "Cardiology", "desc": "Advanced heart care from diagnostics to complex surgeries.", "icon_name": "Activity" },
    { "name": "Neurology", "desc": "Expert care for complex brain and nervous system disorders.", "icon_name": "UserPlus" },
    { "name": "Orthopedics", "desc": "Comprehensive bone and joint care for all life stages.", "icon_name": "BriefcaseMedical" },
    { "name": "Pediatrics", "desc": "Dedicated healthcare for the emotional and physical needs of children.", "icon_name": "Heart" },
    { "name": "Diagnostics", "desc": "Modern imaging and laboratory services for accurate diagnosis.", "icon_name": "FileText" },
    { "name": "Emergency", "desc": "Round-the-clock emergency care with rapid response teams.", "icon_name": "Clock" }
]'),
('home', 'doctors_section', '{
    "tagline": "Our Specialists",
    "title": "Learn from Our Renowned Medical Professionals",
    "button_text": "View All Doctors"
}'),
('home', 'doctors_list', '[
    { "name": "Dr. Sarah Johnson", "specialty": "Cardiology", "role": "Chief Physician", "image_url": "" },
    { "name": "Dr. Michael Chen", "specialty": "Neurology", "role": "Senior Neurosurgeon", "image_url": "" },
    { "name": "Dr. James Wilson", "specialty": "Orthopedics", "role": "Consultant", "image_url": "" },
    { "name": "Dr. Emily Adams", "specialty": "Pediatrics", "role": "Lead Pediatrician", "image_url": "" }
]'),
('home', 'cta', '{
    "title": "Ready to Experience Better Healthcare Management?",
    "description": "Book your appointment today or explore our portal for seamless record management and care coordination.",
    "button_primary": "Book Visit Now",
    "button_secondary": "Learn About MedicsHMS"
}'),

-- About Page
('about', 'about_header', '{
    "tagline": "Our Story",
    "title_part1": "A Legacy of",
    "title_part2": "Care and Innovation.",
    "description": "Founded on the principles of empathy and excellence, MedicsHMS has grown from a local clinic to a premier multi-specialty hospital.",
    "stat1_value": "25+",
    "stat1_label": "Years of Excellence",
    "stat2_value": "500+",
    "stat2_label": "Staff Members",
    "image_url": "/about_hero.png"
}'),
('about', 'mission', '{
    "title": "Our Mission",
    "description": "To provide world-class, affordable healthcare to all through technological innovation, clinical excellence, and deep compassion."
}'),
('about', 'vision', '{
    "title": "Our Vision",
    "description": "To become the most trusted healthcare partner globally, known for transforming lives through personalized medicine and groundbreaking research."
}'),
('about', 'values_intro', '{
    "tagline": "Our Values",
    "title": "The Pillars of MedicsHMS"
}'),
('about', 'values_list', '[
    { "title": "Compassion", "desc": "We treat every patient with dignity and deep empathy.", "icon_name": "Heart" },
    { "title": "Excellence", "desc": "We strive for clinical and operational perfection.", "icon_name": "Zap" },
    { "title": "Innovation", "desc": "Always pushing boundaries in medical technology.", "icon_name": "Activity" }
]'),

-- Services Page
('services', 'services_header', '{
    "tagline": "Our Services",
    "title_part1": "Advanced Healthcare",
    "title_part2": "Tailored for You.",
    "description": "We offer a wide range of medical services designed to provide you with the best possible care."
}'),
('services', 'services_list', '[
    { "title": "General Checkup", "desc": "Regular health screenings and examinations.", "icon_name": "Activity" },
    { "title": "Cardiology", "desc": "Expert heart care using latest techniques.", "icon_name": "Heart" },
    { "title": "Neurology", "desc": "Specialized treatment for brain and spine.", "icon_name": "Zap" }
]'),
('services', 'process_cta', '{
    "title": "Experience Seamless Patient Care Journey",
    "button_text": "Get Started Today",
    "subtext": "No payment required for booking"
}'),

-- Contact Page
('contact', 'contact_header', '{
    "tagline": "Contact Us",
    "title_part1": "We''re Here to",
    "title_part2": "Listen and Care.",
    "description": "Have questions about our services or need to book an appointment? Our team is available 24/7 to assist you."
}'),
('contact', 'contact_info', '{
    "phone1": "+1 (800) 123-4567",
    "phone2": "+1 (800) 765-4321",
    "email1": "care@medicshms.com",
    "email2": "info@medicshms.com",
    "address_line1": "123 Health Ave, Medical District,",
    "address_line2": "New York, NY 10001"
}'),
('contact', 'quick_access', '[
    { "title": "Emergency Room", "meta": "Open 24/7", "icon_name": "Clock", "contact": "+1 (800) 911-0000" },
    { "title": "Appointments", "meta": "Mon - Sat (8am - 8pm)", "icon_name": "CheckCircle", "contact": "+1 (800) 123-4567" },
    { "title": "Patient Records", "meta": "Through Portal", "icon_name": "Send", "contact": "portal@medicshms.com" }
]'),

-- Common/Global
('global', 'common/footer', '{
    "description": "Your health is our priority. We are committed to providing the best medical services with state-of-the-art facilities.",
    "location": "123 Medical Drive, Health City",
    "phone": "+234 800 MEDICS",
    "email": "info@medicshms.com"
}')
ON CONFLICT (page_path, section_key) 
DO UPDATE SET content = EXCLUDED.content;
