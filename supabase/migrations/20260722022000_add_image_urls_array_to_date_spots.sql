-- Add image_urls TEXT[] column to date_spots table for multiple photo uploads (up to 10 photos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'date_spots' 
        AND column_name = 'image_urls'
    ) THEN
        ALTER TABLE public.date_spots ADD COLUMN image_urls TEXT[] DEFAULT '{}';
    END IF;
END $$;
