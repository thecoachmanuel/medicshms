ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'patient' CHECK (ticket_type IN ('patient', 'tenant'));

-- Allow public (anon) users to submit support tickets
CREATE POLICY "public_support_insert" ON public.support_tickets 
FOR INSERT TO anon WITH CHECK (true);

-- Ensure authenticated users can also insert their own tickets
CREATE POLICY "authenticated_support_insert" ON public.support_tickets 
FOR INSERT TO authenticated WITH CHECK (true);
