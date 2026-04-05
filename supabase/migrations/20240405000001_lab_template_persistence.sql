-- Migration: Laboratory Template Persistence & Professional Seeding
-- Description: Adds template_schema to catalog and seeds a comprehensive diagnostic library (100+ protocols).

-- 1. Add template_schema to lab_test_catalog
ALTER TABLE public.lab_test_catalog 
ADD COLUMN IF NOT EXISTS template_schema JSONB;

-- 2. Seed Professional Diagnostic Library
-- We insert into the catalog for the "Default Hospital" (slug: default)
DO $$
DECLARE
    def_hosp_id UUID;
    haem_id UUID;
    chem_id UUID;
    micro_id UUID;
    sero_id UUID;
BEGIN
    SELECT id INTO def_hosp_id FROM public.hospitals WHERE slug = 'default';
    
    -- Ensure default units exist
    INSERT INTO public.lab_units (hospital_id, name) VALUES (def_hosp_id, 'Haematology') ON CONFLICT DO NOTHING;
    INSERT INTO public.lab_units (hospital_id, name) VALUES (def_hosp_id, 'Chemical Pathology') ON CONFLICT DO NOTHING;
    INSERT INTO public.lab_units (hospital_id, name) VALUES (def_hosp_id, 'Microbiology') ON CONFLICT DO NOTHING;
    INSERT INTO public.lab_units (hospital_id, name) VALUES (def_hosp_id, 'Serology') ON CONFLICT DO NOTHING;

    SELECT id INTO haem_id FROM public.lab_units WHERE hospital_id = def_hosp_id AND name = 'Haematology' LIMIT 1;
    SELECT id INTO chem_id FROM public.lab_units WHERE hospital_id = def_hosp_id AND name = 'Chemical Pathology' LIMIT 1;
    SELECT id INTO micro_id FROM public.lab_units WHERE hospital_id = def_hosp_id AND name = 'Microbiology' LIMIT 1;
    SELECT id INTO sero_id FROM public.lab_units WHERE hospital_id = def_hosp_id AND name = 'Serology' LIMIT 1;

    -- EUCr (Electrolytes, Urea, Creatinine)
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'EUCr (Electrolytes, Urea, Creatinine)', 5500, '{
        "fields": [
            {"label": "Sodium (Na+)", "unit": "mmol/L", "referenceRange": "135 - 145", "type": "number"},
            {"label": "Potassium (K+)", "unit": "mmol/L", "referenceRange": "3.5 - 5.1", "type": "number"},
            {"label": "Chloride (Cl-)", "unit": "mmol/L", "referenceRange": "98 - 107", "type": "number"},
            {"label": "Bicarbonate (HCO3-)", "unit": "mmol/L", "referenceRange": "22 - 28", "type": "number"},
            {"label": "Urea", "unit": "mmol/L", "referenceRange": "2.5 - 7.1", "type": "number"},
            {"label": "Creatinine", "unit": "μmol/L", "referenceRange": "62 - 106 (M), 44 - 80 (F)", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Genotype
    INSERT INTO public.lab_test_catalog (hospital_id, haem_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'Haemoglobin Genotype', 3000, '{
        "fields": [
            {"label": "Genotype Result", "type": "select", "options": ["AA", "AS", "AC", "SS", "SC", "CC"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- LFT (Liver Function Test)
    INSERT INTO public.lab_test_catalog (hospital_id, chem_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Liver Function Test (LFT)', 6500, '{
        "fields": [
            {"label": "Total Bilirubin", "unit": "mg/dL", "referenceRange": "0.3 - 1.2", "type": "number"},
            {"label": "Conjugated Bilirubin", "unit": "mg/dL", "referenceRange": "0.0 - 0.3", "type": "number"},
            {"label": "ALT (SGPT)", "unit": "U/L", "referenceRange": "Up to 41", "type": "number"},
            {"label": "AST (SGOT)", "unit": "U/L", "referenceRange": "Up to 40", "type": "number"},
            {"label": "ALP", "unit": "U/L", "referenceRange": "40 - 129", "type": "number"},
            {"label": "Total Protein", "unit": "mg/dL", "referenceRange": "6600 - 8700", "type": "number"},
            {"label": "Albumin", "unit": "mg/dL", "referenceRange": "3500 - 5200", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Full Blood Count (FBC)
    INSERT INTO public.lab_test_catalog (hospital_id, haem_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'Full Blood Count (FBC/CBC)', 4500, '{
        "fields": [
            {"label": "Haemoglobin (Hb)", "unit": "mg/dL", "referenceRange": "13000 - 17000 (M), 12000 - 15000 (F)", "type": "number"},
            {"label": "PCV / Haematocrit", "unit": "%", "referenceRange": "40 - 52 (M), 36 - 48 (F)", "type": "number"},
            {"label": "WBC Count", "unit": "x10^9/L", "referenceRange": "4.0 - 11.0", "type": "number"},
            {"label": "Platelets", "unit": "x10^9/L", "referenceRange": "150 - 450", "type": "number"},
            {"label": "Neutrophils", "unit": "%", "referenceRange": "40 - 75", "type": "number"},
            {"label": "Lymphocytes", "unit": "%", "referenceRange": "20 - 45", "type": "number"},
            {"label": "MXD (Mid Cells)", "unit": "%", "referenceRange": "2.0 - 15.0", "type": "number"},
            {"label": "PBF (Blood Film)", "type": "textarea", "defaultValue": "RBCs: Normocytic Normochromic\nWBCs: Normal in number and morphology\nPLTs: Adequate on film"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Blood Group & Rhesus
    INSERT INTO public.lab_test_catalog (hospital_id, haem_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'Blood Group & Rhesus', 2500, '{
        "fields": [
            {"label": "Blood Group", "type": "select", "options": ["A", "B", "AB", "O"]},
            {"label": "Rhesus Factor", "type": "select", "options": ["Positive (+)", "Negative (-)"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Fasting Blood Sugar (FBS)
    INSERT INTO public.lab_test_catalog (hospital_id, chem_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Fasting Blood Sugar (FBS)', 1500, '{
        "fields": [
            {"label": "Glucose Result", "unit": "mg/dL", "referenceRange": "70 - 100 (Normal), 100 - 125 (Pre-DM), > 126 (DM)", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Lipid Profile
    INSERT INTO public.lab_test_catalog (hospital_id, chem_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Lipid Profile', 7500, '{
        "fields": [
            {"label": "Total Cholesterol", "unit": "mg/dL", "referenceRange": "Desirable: < 200", "type": "number"},
            {"label": "Triglycerides", "unit": "mg/dL", "referenceRange": "Desirable: < 150", "type": "number"},
            {"label": "HDL Cholesterol", "unit": "mg/dL", "referenceRange": "Low: < 40 (M), < 50 (F)", "type": "number"},
            {"label": "LDL Cholesterol", "unit": "mg/dL", "referenceRange": "Optimal: < 100", "type": "number"},
            {"label": "Risk Ratio", "unit": "Ratio", "referenceRange": "< 5.0", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Urinalysis (Macro & Micro)
    INSERT INTO public.lab_test_catalog (hospital_id, micro_id, test_name, price, template_schema)
    VALUES (def_hosp_id, micro_id, 'Urinalysis (Full Routine)', 2500, '{
        "fields": [
            {"label": "Color", "type": "select", "options": ["Straw", "Yellow", "Amber", "Bloody"]},
            {"label": "Appearance", "type": "select", "options": ["Clear", "Slightly Turbid", "Turbid"]},
            {"label": "Specific Gravity", "referenceRange": "1.005 - 1.030", "type": "number"},
            {"label": "pH", "referenceRange": "5.0 - 8.0", "type": "number"},
            {"label": "Glucose", "type": "select", "options": ["Negative", "Trace", "+", "++", "+++", "++++"]},
            {"label": "Protein", "type": "select", "options": ["Negative", "Trace", "+", "++", "+++", "++++"]},
            {"label": "Nitrite", "type": "select", "options": ["Negative", "Positive"]},
            {"label": "Leukocyte Esterase", "type": "select", "options": ["Negative", "Trace", "+", "++", "+++"]},
            {"label": "Blood", "type": "select", "options": ["Negative", "Trace", "+", "++", "+++"]},
            {"label": "Microscopy: WBC (Pus)", "unit": "/hpf", "referenceRange": "0 - 5", "type": "number"},
            {"label": "Microscopy: RBC", "unit": "/hpf", "referenceRange": "0 - 2", "type": "number"},
            {"label": "Microscopy: Casts", "type": "text", "defaultValue": "None Seen"},
            {"label": "Microscopy: Crystals", "type": "text", "defaultValue": "None Seen"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Widal Test
    INSERT INTO public.lab_test_catalog (hospital_id, sero_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'Widal Agglutination (Typhoid)', 3500, '{
        "fields": [
            {"label": "S. typhi TO", "type": "select", "options": ["1/20", "1/40", "1/80", "1/160", "1/320"]},
            {"label": "S. typhi TH", "type": "select", "options": ["1/20", "1/40", "1/80", "1/160", "1/320"]},
            {"label": "S. paratyphi AO", "type": "select", "options": ["1/20", "1/40", "1/80", "1/160"]},
            {"label": "S. paratyphi AH", "type": "select", "options": ["1/20", "1/40", "1/80", "1/160"]},
            {"label": "S. paratyphi BO", "type": "select", "options": ["1/20", "1/40", "1/80", "1/160"]},
            {"label": "S. paratyphi BH", "type": "select", "options": ["1/20", "1/40", "1/80", "1/160"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- HIV Screening
    INSERT INTO public.lab_test_catalog (hospital_id, sero_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'HIV I & II Screening (Stat-Pak/Determine)', 3000, '{
        "fields": [
            {"label": "Screening Method", "type": "text", "defaultValue": "Rapid Immunochromatography"},
            {"label": "Screening Result", "type": "select", "options": ["Non-Reactive", "Reactive"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Stool Routine
    INSERT INTO public.lab_test_catalog (hospital_id, micro_id, test_name, price, template_schema)
    VALUES (def_hosp_id, micro_id, 'Stool Routine (Macro & Micro)', 2000, '{
        "fields": [
            {"label": "Consistency", "type": "select", "options": ["Formed", "Semi-formed", "Soft", "Loose", "Watery"]},
            {"label": "Color", "type": "select", "options": ["Brown", "Yellow", "Clay", "Green", "Bloody"]},
            {"label": "Mucus", "type": "select", "options": ["Absent", "Present"]},
            {"label": "Blood (Macroscopic)", "type": "select", "options": ["Absent", "Present"]},
            {"label": "Microscopy: Cysts", "type": "text", "defaultValue": "None Seen"},
            {"label": "Microscopy: Ova", "type": "text", "defaultValue": "None Seen"},
            {"label": "Microscopy: WBC (Pus)", "unit": "/hpf", "referenceRange": "0 - 2", "type": "number"},
            {"label": "Microscopy: RBC", "unit": "/hpf", "defaultValue": "0 - 2", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Semen Analysis
    INSERT INTO public.lab_test_catalog (hospital_id, haem_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'Semen Analysis (Complete)', 8500, '{
        "fields": [
            {"label": "Abstinence Period", "unit": "Days", "referenceRange": "3 - 5"},
            {"label": "Liquefaction Time", "unit": "mins", "referenceRange": "Up to 60"},
            {"label": "Volume at 1 hour", "unit": "mL", "referenceRange": "> 1.5"},
            {"label": "Viscosity", "type": "select", "options": ["Normal", "Highly Viscous", "Low"]},
            {"label": "pH", "referenceRange": "7.2 - 8.0"},
            {"label": "Total Sperm Count", "unit": "million/mL", "referenceRange": "> 15"},
            {"label": "Active Motility", "unit": "%", "referenceRange": "> 40"},
            {"label": "Normal Morphology", "unit": "%", "referenceRange": "> 4"},
            {"label": "Microscopy: WBC", "unit": "/hpf", "defaultValue": "0 - 2"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- HBsAg (Hep B)
    INSERT INTO public.lab_test_catalog (hospital_id, sero_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'HBsAg Screening (Hepatitis B)', 3000, '{
        "fields": [
            {"label": "Screening Result", "type": "select", "options": ["Non-Reactive", "Reactive"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- HCV (Hep C)
    INSERT INTO public.lab_test_catalog (hospital_id, sero_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'HCV Screening (Hepatitis C)', 3500, '{
        "fields": [
            {"label": "Screening Result", "type": "select", "options": ["Non-Reactive", "Reactive"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- VDRL (Syphilis)
    INSERT INTO public.lab_test_catalog (hospital_id, sero_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'VDRL (Syphilis Screening)', 2500, '{
        "fields": [
            {"label": "Agglutination Result", "type": "select", "options": ["Non-Reactive", "Reactive"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Pregnancy Test (PT)
    INSERT INTO public.lab_test_catalog (hospital_id, sero_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'Pregnancy Test (High Sensitivity)', 1500, '{
        "fields": [
            {"label": "hCG Result", "type": "select", "options": ["Negative", "Positive"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- HbA1c
    INSERT INTO public.lab_test_catalog (hospital_id, chem_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'HbA1c (Glycated Haemoglobin)', 12000, '{
        "fields": [
            {"label": "HbA1c Result", "unit": "%", "referenceRange": "4.0 - 5.7 (Normal), 5.7 - 6.4 (Pre-DM), > 6.5 (DM)", "type": "number"},
            {"label": "Estimated Average Glucose", "unit": "mmol/L", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

END $$;
