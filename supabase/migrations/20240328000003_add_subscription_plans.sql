-- Migration: Subscription Plans System
-- Description: Create subscription plans and link them to hospitals

-- 1. Create Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly NUMERIC NOT NULL DEFAULT 0,
    price_yearly NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'NGN',
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans
CREATE POLICY "public_read_plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "platform_admin_all_plans" ON public.subscription_plans
    FOR ALL TO authenticated
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'platform_admin');

-- 2. Seed Initial Plans
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, currency, features)
VALUES 
('Free Trial', 'free-trial', 'Perfect for evaluating our platform', 0, 0, 'NGN', '["All Hospital Features", "5 Staff Members", "Unlimited Patients", "Community Support"]'),
('Standard Hospital', 'standard', 'Ideal for small clinics and private practices', 45000, 450000, 'NGN', '["Standard Support", "20 Staff Members", "Custom Site Settings", "Paystack Ready", "Basic Reports"]'),
('Pro Hospital', 'pro', 'For established medical centers and multiple branches', 95000, 950000, 'NGN', '["Priority SaaS Support", "Unlimited Staff", "Custom Branding", "Advanced Analytics", "White-label Options"]')
ON CONFLICT (slug) DO NOTHING;

-- 3. Update Hospitals Table
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id);
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));

-- Update existing hospitals to the Free Trial plan by default
UPDATE public.hospitals SET plan_id = (SELECT id FROM public.subscription_plans WHERE slug = 'free-trial') WHERE plan_id IS NULL;

-- 4. Trigger for updated_at
CREATE TRIGGER set_updated_at_subscription_plans BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
