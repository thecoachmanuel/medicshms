-- Migration: Add booking_mode and sessions support to slot_configs
-- This enables high-volume hospitals to use Time Ranges/Sessions

ALTER TABLE public.slot_configs 
ADD COLUMN IF NOT EXISTS booking_mode TEXT DEFAULT 'Slot' CHECK (booking_mode IN ('Slot', 'Range')),
ADD COLUMN IF NOT EXISTS sessions JSONB DEFAULT '[]'::jsonb;

-- Also add to slot_defaults for global settings
ALTER TABLE public.slot_defaults
ADD COLUMN IF NOT EXISTS default_booking_mode TEXT DEFAULT 'Slot' CHECK (default_booking_mode IN ('Slot', 'Range')),
ADD COLUMN IF NOT EXISTS default_sessions JSONB DEFAULT '[]'::jsonb;
