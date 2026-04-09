-- Migration: Expanded Laboratory Diagnostic Library (50+ New Protocols)
-- Description: Adds Haematology, Chemical Pathology, Endocrinology, Tumor Markers, and Microbiology templates.

DO $$
DECLARE
    def_hosp_id UUID;
    haem_id UUID;
    chem_id UUID;
    micro_id UUID;
    sero_id UUID;
BEGIN
    -- 1. Get Target Hospital (Default)
    SELECT id INTO def_hosp_id FROM public.hospitals WHERE slug = 'default';
    
    -- 2. Fetch/Ensure Units
    SELECT id INTO haem_id FROM public.lab_units WHERE hospital_id = def_hosp_id AND name = 'Haematology' LIMIT 1;
    SELECT id INTO chem_id FROM public.lab_units WHERE hospital_id = def_hosp_id AND name = 'Chemical Pathology' LIMIT 1;
    SELECT id INTO micro_id FROM public.lab_units WHERE hospital_id = def_hosp_id AND name = 'Microbiology' LIMIT 1;
    SELECT id INTO sero_id FROM public.lab_units WHERE hospital_id = def_hosp_id AND name = 'Serology' LIMIT 1;

    -- If units don't exist, created them (fallback)
    IF haem_id IS NULL THEN
        INSERT INTO public.lab_units (hospital_id, name) VALUES (def_hosp_id, 'Haematology') RETURNING id INTO haem_id;
    END IF;
    IF chem_id IS NULL THEN
        INSERT INTO public.lab_units (hospital_id, name) VALUES (def_hosp_id, 'Chemical Pathology') RETURNING id INTO chem_id;
    END IF;
    IF micro_id IS NULL THEN
        INSERT INTO public.lab_units (hospital_id, name) VALUES (def_hosp_id, 'Microbiology') RETURNING id INTO micro_id;
    END IF;
    IF sero_id IS NULL THEN
        INSERT INTO public.lab_units (hospital_id, name) VALUES (def_hosp_id, 'Serology') RETURNING id INTO sero_id;
    END IF;

    -- --- HAEMATOLOGY EXPANSION --- --

    -- Prothrombin Time (PT)
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'Prothrombin Time (PT) & INR', 4500, '{
        "fields": [
            {"label": "Patient Time", "unit": "seconds", "referenceRange": "11.0 - 13.5", "type": "number"},
            {"label": "Control Time", "unit": "seconds", "type": "number"},
            {"label": "INR (International Normalized Ratio)", "referenceRange": "0.8 - 1.2", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- APTT
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'Activated Partial Thromboplastin Time (APTT)', 5000, '{
        "fields": [
            {"label": "Patient Time", "unit": "seconds", "referenceRange": "25 - 35", "type": "number"},
            {"label": "Control Time", "unit": "seconds", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- D-Dimer
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'D-Dimer (Quantitative)', 15000, '{
        "fields": [
            {"label": "D-Dimer Result", "unit": "ng/mL FEU", "referenceRange": "< 500", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- ESR
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'Erythrocyte Sedimentation Rate (ESR)', 1500, '{
        "fields": [
            {"label": "ESR (1st Hour)", "unit": "mm/hr", "referenceRange": "0-15 (M), 0-20 (F)", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Reticulocyte Count
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'Reticulocyte Count', 2500, '{
        "fields": [
            {"label": "Reticulocyte Result", "unit": "%", "referenceRange": "0.5 - 2.5", "type": "number"},
            {"label": "Corrected Retic Count", "unit": "%", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- G6PD
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'G6PD Screening', 3500, '{
        "fields": [
            {"label": "G6PD Status", "type": "select", "options": ["Adequate / Normal", "Deficient"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- --- CHEMICAL PATHOLOGY EXPANSION --- --

    -- Uric Acid
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Uric Acid (Serum)', 2500, '{
        "fields": [
            {"label": "Uric Acid Result", "unit": "mg/dL", "referenceRange": "3.4 - 7.0 (M), 2.4 - 5.7 (F)", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Calcium
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Calcium (Total)', 3000, '{
        "fields": [
            {"label": "Total Calcium", "unit": "mg/dL", "referenceRange": "8.5 - 10.2", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Magnesium
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Magnesium', 3500, '{
        "fields": [
            {"label": "Magnesium Result", "unit": "mg/dL", "referenceRange": "1.7 - 2.2", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Phosphorus
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Phosphorus', 3000, '{
        "fields": [
            {"label": "Phosphorus Result", "unit": "mg/dL", "referenceRange": "2.5 - 4.5", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Amylase
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Amylase', 5500, '{
        "fields": [
            {"label": "Amylase Result", "unit": "U/L", "referenceRange": "30 - 110", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Lipase
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Lipase', 6500, '{
        "fields": [
            {"label": "Lipase Result", "unit": "U/L", "referenceRange": "0 - 160", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- LDH
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'LDH (Lactate Dehydrogenase)', 5500, '{
        "fields": [
            {"label": "LDH Result", "unit": "U/L", "referenceRange": "140 - 280", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- CK-MB
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'CK-MB (Cardiac Isoenzyme)', 8500, '{
        "fields": [
            {"label": "CK-MB Result", "unit": "U/L", "referenceRange": "0 - 25", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Troponin I
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Troponin I (High Sensitivity)', 12500, '{
        "fields": [
            {"label": "Troponin I Result", "unit": "ng/mL", "referenceRange": "< 0.04", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Iron Profile
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Iron Profile', 12000, '{
        "fields": [
            {"label": "Serum Iron", "unit": "ug/dL", "referenceRange": "60 - 170", "type": "number"},
            {"label": "TIBC", "unit": "ug/dL", "referenceRange": "240 - 450", "type": "number"},
            {"label": "Transferrin Saturation", "unit": "%", "referenceRange": "20 - 50", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Ferritin
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Ferritin', 9500, '{
        "fields": [
            {"label": "Ferritin Result", "unit": "ng/mL", "referenceRange": "20-250 (M), 10-120 (F)", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- --- ENDOCRINOLOGY EXPANSION --- --

    -- Beta-hCG Quantitative
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Beta-hCG (Quantitative)', 8500, '{
        "fields": [
            {"label": "hCG Result", "unit": "mIU/mL", "referenceRange": "Non-pregnant: < 5", "type": "number"},
            {"label": "Gestational Age Estimate", "type": "text"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Serum Cortisol
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Cortisol (8 AM)', 12000, '{
        "fields": [
            {"label": "Cortisol Result", "unit": "ug/dL", "referenceRange": "5 - 23", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Estradiol
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Estradiol (E2)', 10000, '{
        "fields": [
            {"label": "Estradiol Result", "unit": "pg/mL", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Progesterone
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Progesterone', 10000, '{
        "fields": [
            {"label": "Progesterone Result", "unit": "ng/mL", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Testosterone Free
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Testosterone (Free)', 15000, '{
        "fields": [
            {"label": "Free Testosterone", "unit": "pg/mL", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Insulin Fasting
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Insulin (Fasting)', 12000, '{
        "fields": [
            {"label": "Insulin Result", "unit": "uIU/mL", "referenceRange": "2.6 - 24.9", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- C-Peptide
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'C-Peptide', 14000, '{
        "fields": [
            {"label": "C-Peptide Result", "unit": "ng/mL", "referenceRange": "1.1 - 4.4", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- --- TUMOR MARKERS EXPANSION --- --

    -- CA-125
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'CA-125 (Ovarian Marker)', 15000, '{
        "fields": [
            {"label": "CA-125 Result", "unit": "U/mL", "referenceRange": "< 35", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- CA-15-3
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'CA-15-3 (Breast Marker)', 15000, '{
        "fields": [
            {"label": "CA-15-3 Result", "unit": "U/mL", "referenceRange": "< 30", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- CA-19-9
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'CA-19-9 (Gastrointestinal Marker)', 15000, '{
        "fields": [
            {"label": "CA-19-9 Result", "unit": "U/mL", "referenceRange": "< 37", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- --- MICROBIOLOGY EXPANSION --- --

    -- Sputum AFB
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, micro_id, 'Sputum for AFB (Acid Fast Bacilli)', 3500, '{
        "fields": [
            {"label": "Day 1 Result", "defaultValue": "No AFB Seen"},
            {"label": "Day 2 Result", "defaultValue": "No AFB Seen"},
            {"label": "Day 3 Result", "defaultValue": "No AFB Seen"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Mantoux
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, micro_id, 'Mantoux Test (PPD)', 4500, '{
        "fields": [
            {"label": "Date Injected", "type": "text"},
            {"label": "Date Read (48-72 hrs)", "type": "text"},
            {"label": "Induration Size", "unit": "mm", "type": "number"},
            {"label": "Interpretation", "type": "select", "options": ["Negative", "Positive"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Gram Stain
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, micro_id, 'Gram Stain Examination', 2000, '{
        "fields": [
            {"label": "Epithelial Cells", "type": "text"},
            {"label": "Pus Cells", "type": "text"},
            {"label": "Gram Positive Organisms", "type": "text"},
            {"label": "Gram Negative Organisms", "type": "text"},
            {"label": "Yeast Cells", "type": "text"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Culture & Sensitivity Template
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, micro_id, 'Urine Culture & Sensitivity', 8500, '{
        "fields": [
            {"label": "Culture Result", "defaultValue": "No significant growth after 48 hours of incubation"},
            {"label": "Organism Isolated", "type": "text"},
            {"label": "Colony Count", "unit": "CFU/mL"},
            {"label": "Antibiotic Sensitivity List", "type": "textarea", "defaultValue": "Sensitive:\nResistant:\nIntermediate:"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- HVS Microscopy
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, micro_id, 'High Vaginal Swab (HVS) Microscopy', 3500, '{
        "fields": [
            {"label": "Appearance", "type": "text"},
            {"label": "Pus Cells", "unit": "/hpf"},
            {"label": "Epithelial Cells", "unit": "/hpf"},
            {"label": "Yeast Cells", "type": "select", "options": ["Absent", "Present (+)", "Present (++)", "Present (+++)"]},
            {"label": "T. Vaginalis", "type": "select", "options": ["Absent", "Present"]},
            {"label": "Clue Cells", "type": "select", "options": ["Absent", "Present"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- --- SEROLOGY & IMMUNOLOGY EXPANSION --- --

    -- ANA
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'Anti-Nuclear Antibody (ANA)', 12000, '{
        "fields": [
            {"label": "ANA Result", "type": "select", "options": ["Negative", "Positive"]},
            {"label": "Titre", "type": "text"},
            {"label": "Pattern", "type": "text"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Anti-dsDNA
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'Anti-dsDNA', 15000, '{
        "fields": [
            {"label": "Result", "unit": "IU/mL", "referenceRange": "< 25 (Negative)", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- HBsAb
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'HBsAb (Hepatitis B Surface Antibody)', 4500, '{
        "fields": [
            {"label": "Antibody Status", "type": "select", "options": ["Negative (Non-Immune)", "Positive (Immune)"]},
            {"label": "Titre (Optional)", "unit": "mIU/mL"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- HAV IgM
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'Hepatitis A (HAV) IgM', 5500, '{
        "fields": [
            {"label": "Result", "type": "select", "options": ["Non-Reactive", "Reactive"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Dengue NS1
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'Dengue NS1 Antigen', 6500, '{
        "fields": [
            {"label": "NS1 Ag Result", "type": "select", "options": ["Negative", "Positive"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Dengue IgM/IgG
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'Dengue Serology (IgM & IgG)', 9500, '{
        "fields": [
            {"label": "Dengue IgM", "type": "select", "options": ["Negative", "Positive"]},
            {"label": "Dengue IgG", "type": "select", "options": ["Negative", "Positive"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Torch Profile
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'TORCH Profile (IgG / IgM)', 25000, '{
        "fields": [
            {"label": "Toxoplasma Gondii", "type": "text", "defaultValue": "IgG: Neg, IgM: Neg"},
            {"label": "Rubella Virus", "type": "text", "defaultValue": "IgG: Neg, IgM: Neg"},
            {"label": "Cytomegalovirus (CMV)", "type": "text", "defaultValue": "IgG: Neg, IgM: Neg"},
            {"label": "Herpes Simplex (HSV I/II)", "type": "text", "defaultValue": "IgG: Neg, IgM: Neg"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Uric Acid Standalone
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Uric Acid', 3000, '{
        "fields": [
            {"label": "Result", "unit": "mg/dL", "referenceRange": "3.5 - 7.2", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Serum Protein Electrophoresis
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Protein Electrophoresis', 18000, '{
        "fields": [
            {"label": "Albumin", "unit": "%", "referenceRange": "52 - 65"},
            {"label": "Alpha-1 Globulin", "unit": "%", "referenceRange": "2.5 - 5.0"},
            {"label": "Alpha-2 Globulin", "unit": "%", "referenceRange": "7.0 - 13.0"},
            {"label": "Beta Globulin", "unit": "%", "referenceRange": "8.0 - 14.0"},
            {"label": "Gamma Globulin", "unit": "%", "referenceRange": "12.0 - 22.0"},
            {"label": "M-Spike", "type": "text", "defaultValue": "Not Detected"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

     -- G6PD Quantitative (Advanced)
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, haem_id, 'G6PD Enzyme Assay (Quantitative)', 12000, '{
        "fields": [
            {"label": "G6PD Activity", "unit": "U/g Hb", "referenceRange": "7.0 - 14.3", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- H. Pylori (Serum Antibody)
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, sero_id, 'H. Pylori (Serum Antibody Screen)', 3000, '{
        "fields": [
            {"label": "Antibody Status", "type": "select", "options": ["Negative", "Positive"]}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Blood Culture (Automated/Manual)
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, micro_id, 'Blood Culture & Sensitivity', 15000, '{
        "fields": [
            {"label": "Incubation Period", "unit": "Days", "defaultValue": "5 Days"},
            {"label": "Result", "defaultValue": "No aerobic or anaerobic growth after 5 days of incubation"},
            {"label": "Organism", "type": "text"},
            {"label": "Sensitivities", "type": "textarea"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Wound Swab C&S
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, micro_id, 'Wound Swab Culture & Sensitivity', 8000, '{
        "fields": [
            {"label": "Gram Stain Result", "type": "text"},
            {"label": "Culture Result", "type": "text"},
            {"label": "Sensitivities", "type": "textarea"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- CSF Analysis (Full)
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'CSF Analysis (Bio + Micro)', 15000, '{
        "fields": [
            {"label": "Appearance", "type": "text"},
            {"label": "Total WBC", "unit": "cells/uL", "referenceRange": "0 - 5"},
            {"label": "Glucose", "unit": "mg/dL", "referenceRange": "40 - 70"},
            {"label": "Protein", "unit": "mg/dL", "referenceRange": "15 - 45"},
            {"label": "Gram Stain", "type": "text"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- ASAT (Standalone)
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'ASAT (SGOT) Standalone', 2000, '{
        "fields": [
            {"label": "Result", "unit": "U/L", "referenceRange": "Up to 40", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- ALAT (Standalone)
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'ALAT (SGPT) Standalone', 2000, '{
        "fields": [
            {"label": "Result", "unit": "U/L", "referenceRange": "Up to 41", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

    -- Serum Albumin (Standalone)
    INSERT INTO public.lab_test_catalog (hospital_id, unit_id, test_name, price, template_schema)
    VALUES (def_hosp_id, chem_id, 'Serum Albumin (Standalone)', 2000, '{
        "fields": [
            {"label": "Result", "unit": "g/dL", "referenceRange": "3.5 - 5.2", "type": "number"}
        ]
    }') ON CONFLICT (hospital_id, test_name) DO UPDATE SET template_schema = EXCLUDED.template_schema;

END $$;
