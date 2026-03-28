-- Update hospitals table to include subscription_end_date
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;
