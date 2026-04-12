-- Migration: Add unique constraint to slot_configs key
-- This is required for upsert operations in the slot-config API

-- 1. Ensure any duplicate keys are cleaned up first (keep the most recent one)
DELETE FROM public.slot_configs a
USING public.slot_configs b
WHERE a.id < b.id
AND a.key = b.key;

-- 2. Add the unique constraint
ALTER TABLE public.slot_configs
DROP CONSTRAINT IF EXISTS slot_configs_key_key,
ADD CONSTRAINT slot_configs_key_key UNIQUE (key);
