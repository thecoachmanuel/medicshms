-- Migration: New Hospital Roles and Services
-- Description: Adds Nurse, Lab Scientist, Pharmacist, and Radiologist roles along with Vitals, Lab, Pharmacy, and Radiology tables.

-- 1. Update Profiles Role Check
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('Admin', 'Doctor', 'Receptionist', 'Patient', 'platform_admin', 'Nurse', 'Lab Scientist', 'Pharmacist', 'Radiologist'));

-- 2. New Role Tables
CREATE TABLE IF NOT EXISTS public.nurses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    profile_photo TEXT,
    qualifications TEXT,
    experience TEXT,
    gender TEXT,
    date_of_birth DATE,
    shift TEXT,
    joining_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lab_scientists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    profile_photo TEXT,
    specialization TEXT,
    experience TEXT,
    gender TEXT,
    date_of_birth DATE,
    joining_date DATE,
    license_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pharmacists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    profile_photo TEXT,
    qualifications TEXT,
    experience TEXT,
    gender TEXT,
    date_of_birth DATE,
    joining_date DATE,
    license_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.radiologists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    profile_photo TEXT,
    specialization TEXT,
    experience TEXT,
    gender TEXT,
    date_of_birth DATE,
    joining_date DATE,
    license_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Service Tables
-- 3a. Vitals
CREATE TABLE IF NOT EXISTS public.patient_vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.public_appointments(id) ON DELETE SET NULL,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Usually a Nurse
    blood_pressure TEXT,
    heart_rate TEXT,
    temperature TEXT,
    respiratory_rate TEXT,
    oxygen_saturation TEXT,
    weight TEXT,
    height TEXT,
    bmi TEXT,
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3b. Clinical Requests (Unified Lab & Radiology)
CREATE TABLE IF NOT EXISTS public.clinical_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.public_appointments(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    handled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Lab Scientist or Radiologist
    type TEXT NOT NULL CHECK (type IN ('Laboratory', 'Radiology')),
    test_name TEXT NOT NULL,
    clinical_notes TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    results TEXT,
    file_url TEXT, -- URL to standard document/result PDF
    dicom_url TEXT, -- URL for radiology DICOM viewing if applicable
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3c. Pharmacy Inventory
CREATE TABLE IF NOT EXISTS public.pharmacy_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    quantity INTEGER DEFAULT 0,
    unit_price NUMERIC DEFAULT 0,
    manufacturer TEXT,
    batch_number TEXT,
    expiry_date DATE,
    reorder_level INTEGER DEFAULT 10,
    status TEXT DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock', 'Expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3d. Prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.public_appointments(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    pharmacist_id UUID REFERENCES public.pharmacists(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Dispensed', 'Cancelled')),
    medications JSONB DEFAULT '[]'::jsonb, -- Array of { item_name, inventory_id (optional), dosage, frequency, duration, quantity }
    notes TEXT,
    prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dispensed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Apply `updated_at` triggers and RLS Policies for Tenant Isolation
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('nurses', 'lab_scientists', 'pharmacists', 'radiologists', 'patient_vitals', 'clinical_requests', 'pharmacy_inventory', 'prescriptions')
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        
        -- Policy: Users can only see data from their own hospital
        EXECUTE format('CREATE POLICY "tenant_isolation_policy" ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (
                hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())
                OR 
                (SELECT role FROM public.profiles WHERE id = auth.uid()) = ''platform_admin''
            );', t);

        -- Add trigger for updated_at
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();', t);
    END LOOP;
END;
$$;
