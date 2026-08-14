-- Add video_urls TEXT[] column to date_spots for date video uploads (additive only — no existing data touched)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'date_spots'
        AND column_name = 'video_urls'
    ) THEN
        ALTER TABLE public.date_spots ADD COLUMN video_urls TEXT[] DEFAULT '{}';
    END IF;
END $$;
