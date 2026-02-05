-- Create research_coupons table
CREATE TABLE IF NOT EXISTS public.research_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create research_responses table
CREATE TABLE IF NOT EXISTS public.research_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answers JSONB NOT NULL,
    coupon_code TEXT REFERENCES public.research_coupons(code),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.research_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_responses ENABLE ROW LEVEL SECURITY;

-- Policies for research_coupons (read-only for authenticated users)
CREATE POLICY "Anyone can read unused coupons"
    ON public.research_coupons
    FOR SELECT
    USING (is_used = FALSE);

-- Policies for research_responses (insert only)
CREATE POLICY "Anyone can insert research responses"
    ON public.research_responses
    FOR INSERT
    WITH CHECK (true);

-- Function to get next available coupon
CREATE OR REPLACE FUNCTION public.get_next_coupon()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_code TEXT;
BEGIN
    -- Get the first unused coupon and mark it as used
    UPDATE public.research_coupons
    SET is_used = TRUE, used_at = NOW()
    WHERE id = (
        SELECT id FROM public.research_coupons
        WHERE is_used = FALSE
        ORDER BY created_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING code INTO next_code;
    
    RETURN next_code;
END;
$$;

-- Insert 50 unique coupons
DO $$
DECLARE
    i INTEGER;
    coupon_code TEXT;
BEGIN
    FOR i IN 1..50 LOOP
        coupon_code := 'URBAN-RESEARCH-' || LPAD(i::TEXT, 3, '0');
        INSERT INTO public.research_coupons (code)
        VALUES (coupon_code)
        ON CONFLICT (code) DO NOTHING;
    END LOOP;
END $$;
