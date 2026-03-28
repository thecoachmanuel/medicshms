-- Migration: Add append_medical_history RPC
-- This function appends a new entry to the medical_history JSONB array of a patient.

CREATE OR REPLACE FUNCTION append_medical_history(p_hospital_id UUID, p_patient_id TEXT, p_entry JSONB)
RETURNS VOID AS $$
BEGIN
    UPDATE public.patients
    SET medical_history = medical_history || p_entry::jsonb,
        updated_at = NOW()
    WHERE hospital_id = p_hospital_id AND patient_id = p_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
