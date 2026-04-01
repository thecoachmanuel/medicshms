-- Add Paystack subscription columns to the hospitals table
ALTER TABLE public.hospitals 
ADD COLUMN IF NOT EXISTS paystack_customer_id TEXT,
ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

-- Create an optional payment_transactions table for history
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    reference TEXT NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Allow platform admin to read all, hospital admins to read their own
CREATE POLICY "platform_admin_select_transactions" 
ON public.payment_transactions FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
);

CREATE POLICY "hospital_admin_select_transactions" 
ON public.payment_transactions FOR SELECT 
TO authenticated 
USING (
    hospital_id IN (
        SELECT hospital_id FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'Admin'
    )
);
