-- Migration: Notification Triggers
-- Description: Automated event detection and notification generation.

-- 1. Create Helper Function to Create Notifications
CREATE OR REPLACE FUNCTION public.notify_target(
    p_hospital_id UUID,
    p_user_id UUID,
    p_role TEXT,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_action_url TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (hospital_id, user_id, role, title, message, type, action_url)
    VALUES (p_hospital_id, p_user_id, p_role, p_title, p_message, p_type, p_action_url);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for Appointment Status Changes
CREATE OR REPLACE FUNCTION public.on_appointment_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_patient_name TEXT;
    v_doctor_user_id UUID;
BEGIN
    v_patient_name := NEW.full_name;
    
    -- If assigned to a doctor, get their profile ID
    IF NEW.doctor_assigned_id IS NOT NULL THEN
        SELECT user_id INTO v_doctor_user_id FROM public.doctors WHERE id = NEW.doctor_assigned_id;
    END IF;

    -- CASE: Confirmed
    IF (OLD.appointment_status = 'Pending' AND NEW.appointment_status = 'Confirmed') THEN
        -- Notify Patient (if they have a user account)
        IF NEW.patient_id IS NOT NULL AND NEW.patient_id ~ '^[0-9a-fA-F-]{36}$' THEN
            PERFORM public.notify_target(NEW.hospital_id, NEW.patient_id::UUID, 'Patient', 'Appointment Confirmed', 'Your appointment on ' || NEW.appointment_date || ' has been confirmed.', 'success', '/patient/appointments');
        END IF;
    END IF;

    -- CASE: Arrived (Check-in)
    IF (OLD.appointment_status != 'Arrived' AND NEW.appointment_status = 'Arrived') THEN
        -- Notify Doctor
        IF v_doctor_user_id IS NOT NULL THEN
            PERFORM public.notify_target(NEW.hospital_id, v_doctor_user_id, 'Doctor', 'Patient Arrived', v_patient_name || ' is ready for consultation.', 'info', '/doctor/consultation/' || NEW.id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_appointment_notify ON public.public_appointments;
CREATE TRIGGER tr_appointment_notify
AFTER UPDATE ON public.public_appointments
FOR EACH ROW EXECUTE PROCEDURE public.on_appointment_status_change();

-- 3. Trigger for Clinical Requests (Lab/Radiology)
CREATE OR REPLACE FUNCTION public.on_clinical_request_change()
RETURNS TRIGGER AS $$
DECLARE
    v_module_name TEXT;
    v_role TEXT;
    v_doctor_user_id UUID;
BEGIN
    -- Determine role and module
    IF TG_TABLE_NAME = 'clinical_requests' THEN
        v_module_name := 'Laboratory';
        v_role := 'Lab Scientist';
    ELSE
        v_module_name := 'Radiology';
        v_role := 'Radiologist';
    END IF;

    -- Get requesting doctor's profile ID (if possible)
    -- This assumes we might have an assigned_doctor or similar in the test request, 
    -- but for now, we'll notify the whole role for new requests.

    -- CASE: New Request (Pending)
    IF (TG_OP = 'INSERT' AND NEW.status = 'Pending') THEN
        PERFORM public.notify_target(NEW.hospital_id, NULL, v_role, 'New ' || v_module_name || ' Order', 'A new investigation has been requested for a patient.', 'clinical', '/lab-services');
    END IF;

    -- CASE: Completed (Result Ready)
    IF (OLD.status != 'Completed' AND NEW.status = 'Completed') THEN
        -- Notify Patient
        IF NEW.patient_id IS NOT NULL THEN
            -- We must resolve the user_id (auth.users) from the patients table 
            -- because notifications.user_id references auth.users(id), not patients(id)
            SELECT user_id INTO v_doctor_user_id FROM public.patients WHERE id = NEW.patient_id;
            
            IF v_doctor_user_id IS NOT NULL THEN
                PERFORM public.notify_target(
                    NEW.hospital_id, 
                    v_doctor_user_id, 
                    'Patient', 
                    v_module_name || ' Result Ready', 
                    'Your ' || v_module_name || ' test result is now available.', 
                    'success', 
                    '/patient/records'
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_lab_notify ON public.clinical_requests;
CREATE TRIGGER tr_lab_notify
AFTER INSERT OR UPDATE ON public.clinical_requests
FOR EACH ROW EXECUTE PROCEDURE public.on_clinical_request_change();

-- If radiologists use a different table, we'd add it here. 
-- Assuming for now lab and radiology leverage clinical_requests or similar logic.
