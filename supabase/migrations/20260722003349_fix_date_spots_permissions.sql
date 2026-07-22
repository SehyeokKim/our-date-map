-- Fix date_spots table permissions and RLS policies for anon role

CREATE TABLE IF NOT EXISTS public.date_spots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    image_url TEXT,
    visited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.date_spots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to date_spots" ON public.date_spots;
DROP POLICY IF EXISTS "Allow public insert access to date_spots" ON public.date_spots;

CREATE POLICY "Allow public read access to date_spots" 
ON public.date_spots 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to date_spots" 
ON public.date_spots 
FOR INSERT 
WITH CHECK (true);

GRANT ALL ON public.date_spots TO anon, authenticated, service_role;
