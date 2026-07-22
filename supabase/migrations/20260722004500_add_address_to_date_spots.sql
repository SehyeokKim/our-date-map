-- Add address column to date_spots table
ALTER TABLE public.date_spots ADD COLUMN IF NOT EXISTS address TEXT;
