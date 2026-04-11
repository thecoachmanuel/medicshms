-- Migration: Add Clinical Preferences to Profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS clinical_preferences JSONB DEFAULT '{
  "default_appointment_duration": 30,
  "auto_finalize_results": false,
  "notification_sounds": true,
  "sidebar_collapsed": false
}'::jsonb;
