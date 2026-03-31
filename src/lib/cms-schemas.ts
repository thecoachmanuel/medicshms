export const SECTION_SCHEMAS: Record<string, Record<string, 'text' | 'textarea' | 'image' | 'list'>> = {
  hero: {
    title: 'text',
    description: 'textarea',
    button_primary: 'text',
    button_secondary: 'text',
    image_url: 'image',
    badge_text: 'text',
  },
  stats: {
    stats_list: 'list',
  },
  departments_intro: {
    tagline: 'text',
    title: 'text',
    description: 'textarea',
  },
  departments_list: {
    items: 'list',
  },
  doctors_section: {
    tagline: 'text',
    title: 'text',
    button_text: 'text',
  },
  doctors_list: {
    items: 'list',
  },
  cta: {
    title: 'text',
    description: 'textarea',
    button_primary: 'text',
    button_secondary: 'text',
  },
  'common/footer': {
    description: 'textarea',
    location: 'text',
    phone: 'text',
    email: 'text',
  },
  about_header: {
    tagline: 'text',
    title_part1: 'text',
    title_part2: 'text',
    description: 'textarea',
    stat1_value: 'text',
    stat1_label: 'text',
    stat2_value: 'text',
    stat2_label: 'text',
    image_url: 'image',
  },
  mission: {
    title: 'text',
    description: 'textarea',
  },
  vision: {
    title: 'text',
    description: 'textarea',
  },
  values_intro: {
    tagline: 'text',
    title: 'text',
  },
  values_list: {
    items: 'list',
  },
  services_header: {
    tagline: 'text',
    title_part1: 'text',
    title_part2: 'text',
    description: 'textarea',
  },
  services_list: {
    items: 'list',
  },
  process_cta: {
    title: 'text',
    button_text: 'text',
    subtext: 'text',
  },
  contact_header: {
    tagline: 'text',
    title_part1: 'text',
    title_part2: 'text',
    description: 'textarea',
  },
  contact_info: {
    phone1: 'text',
    phone2: 'text',
    email1: 'text',
    email2: 'text',
    address_line1: 'text',
    address_line2: 'text',
  },
  quick_access: {
    items: 'list',
  },
  features_list: {
    items: 'list',
  }
};

export const LIST_ITEM_SCHEMAS: Record<string, Record<string, 'text' | 'textarea' | 'image'>> = {
  stats: { label: 'text', value: 'text' },
  departments_list: { name: 'text', desc: 'textarea', icon_name: 'text' },
  doctors_list: { name: 'text', specialty: 'text', role: 'text', image_url: 'image' },
  values_list: { title: 'text', desc: 'textarea', icon_name: 'text' },
  services_list: { title: 'text', desc: 'textarea', icon_name: 'text' },
  quick_access: { title: 'text', meta: 'text', icon_name: 'text', contact: 'text' },
  features_list: { title: 'text', desc: 'textarea', icon: 'text' },
};

export const DEFAULT_CONTENT: Record<string, any> = {
  hero: {
    title: "Compassionate Care, Advanced Technology.",
    description: "We provide world-class medical services with a touch of humanity. Manage your health journey seamlessly with our integrated hospital ecosystem.",
    button_primary: "Book Consultation",
    button_secondary: "Portal Login",
    image_url: "/hospital_hero.png",
    badge_text: "5000+ Happy Patients",
  },
  stats: [
    { label: 'Specialist Doctors', value: '150+' },
    { label: 'Patient Recovered', value: '45k+' },
    { label: 'Success Rate', value: '98%' },
    { label: 'Years Experience', value: '25+' },
  ],
  departments_intro: {
    tagline: "Our Departments",
    title: "Comprehensive Care in Every Specialty",
    description: "Equipped with state-of-the-art technology and led by industry experts, our departments cover every aspect of modern medicine."
  },
  departments_list: [
    { name: 'Cardiology', desc: 'Advanced heart care from diagnostics to complex surgeries.', icon_name: 'Activity' },
    { name: 'Neurology', desc: 'Expert care for complex brain and nervous system disorders.', icon_name: 'UserPlus' },
    { name: 'Orthopedics', desc: 'Comprehensive bone and joint care for all life stages.', icon_name: 'BriefcaseMedical' },
    { name: 'Pediatrics', desc: 'Dedicated healthcare for the emotional and physical needs of children.', icon_name: 'Heart' },
    { name: 'Diagnostics', desc: 'Modern imaging and laboratory services for accurate diagnosis.', icon_name: 'FileText' },
    { name: 'Emergency', desc: 'Round-the-clock emergency care with rapid response teams.', icon_name: 'Clock' },
  ],
  doctors_section: {
    tagline: "Our Specialists",
    title: "Learn from Our Renowned Medical Professionals",
    button_text: "View All Doctors"
  },
  doctors_list: [
    { name: 'Dr. Sarah Johnson', specialty: 'Cardiology', role: 'Chief Physician', image_url: '' },
    { name: 'Dr. Michael Chen', specialty: 'Neurology', role: 'Senior Neurosurgeon', image_url: '' },
    { name: 'Dr. James Wilson', specialty: 'Orthopedics', role: 'Consultant', image_url: '' },
    { name: 'Dr. Emily Adams', specialty: 'Pediatrics', role: 'Lead Pediatrician', image_url: '' },
  ],
  cta: {
    title: "Ready to Experience Better Healthcare Management?",
    description: "Book your appointment today or explore our portal for seamless record management and care coordination.",
    button_primary: "Book Visit Now",
    button_secondary: "Learn About MedicsHMS"
  },
  'common/footer': {
    description: "Your health is our priority. We are committed to providing the best medical services with state-of-the-art facilities.",
    location: "123 Medical Drive, Health City",
    phone: "+234 800 MEDICS",
    email: "info@medicshms.com"
  },
  about_header: {
    tagline: "Our Story",
    title_part1: "A Legacy of",
    title_part2: "Care and Innovation.",
    description: "Founded on the principles of empathy and excellence, MedicsHMS has grown from a local clinic to a premier multi-specialty hospital.",
    stat1_value: "25+",
    stat1_label: "Years of Excellence",
    stat2_value: "500+",
    stat2_label: "Staff Members",
    image_url: "/about_hero.png"
  },
  mission: {
    title: "Our Mission",
    description: "To provide world-class, affordable healthcare to all through technological innovation, clinical excellence, and deep compassion."
  },
  vision: {
    title: "Our Vision",
    description: "To become the most trusted healthcare partner globally, known for transforming lives through personalized medicine and groundbreaking research."
  },
  values_intro: {
    tagline: "Our Values",
    title: "The Pillars of MedicsHMS"
  },
  values_list: [
    { title: 'Compassion', desc: 'We treat every patient with dignity and deep empathy.', icon_name: 'Heart' },
    { title: 'Excellence', desc: 'We strive for clinical and operational perfection.', icon_name: 'Zap' },
    { title: 'Innovation', desc: 'Always pushing boundaries in medical technology.', icon_name: 'Activity' },
  ],
  services_header: {
    tagline: "Our Services",
    title_part1: "Advanced Healthcare",
    title_part2: "Tailored for You.",
    description: "We offer a wide range of medical services designed to provide you with the best possible care."
  },
  services_list: [
    { title: 'Health Checkups', desc: 'Comprehensive wellness programs for all ages.', icon_name: 'Activity' },
    { title: 'Modern Lab', desc: 'State-of-the-art diagnostic facilities.', icon_name: 'BriefcaseMedical' },
    { title: 'Emergency', desc: '24/7 rapid response and critical care.', icon_name: 'Clock' },
  ],
  process_cta: {
    title: "Experience Seamless Patient Care Journey",
    button_text: "Get Started Today",
    subtext: "No payment required for booking"
  },
  contact_header: {
    tagline: "Contact Us",
    title_part1: "We're Here to",
    title_part2: "Listen and Care.",
    description: "Have questions about our services or need to book an appointment? Our team is available 24/7 to assist you."
  },
  contact_info: {
    phone1: "+1 (800) 123-4567",
    phone2: "+1 (800) 765-4321",
    email1: "care@medicshms.com",
    email2: "info@medicshms.com",
    address_line1: "123 Health Ave, Medical District,",
    address_line2: "New York, NY 10001"
  },
  quick_access: [
    { title: 'Emergency Room', meta: 'Open 24/7', icon_name: 'Clock', contact: '+1 (800) 911-0000' },
    { title: 'Appointments', meta: 'Mon - Sat (8am - 8pm)', icon_name: 'CheckCircle', contact: '+1 (800) 123-4567' },
    { title: 'Patient Records', meta: 'Through Portal', icon_name: 'Send', contact: 'portal@medicshms.com' },
  ],
};
