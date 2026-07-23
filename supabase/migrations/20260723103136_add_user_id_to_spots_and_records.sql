-- Migration: Add user_id column referencing auth.users(id) to date_spots & records tables
ALTER TABLE public.date_spots 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE public.records 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- Index for performance when querying spots by user_id
CREATE INDEX IF NOT EXISTS idx_date_spots_user_id ON public.date_spots(user_id);

-- Update/Create RLS policies for date_spots to support owner-based modifications while keeping public read
ALTER TABLE public.date_spots ENABLE ROW LEVEL SECURITY;

-- Allow public read access to date_spots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'date_spots' AND policyname = 'Allow public read access to date_spots'
  ) THEN
    CREATE POLICY "Allow public read access to date_spots" ON public.date_spots FOR SELECT USING (true);
  END IF;
END $$;

-- Allow authenticated users to insert spots attached to their user_id (or fallback for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'date_spots' AND policyname = 'Allow authenticated and public insert to date_spots'
  ) THEN
    CREATE POLICY "Allow authenticated and public insert to date_spots" ON public.date_spots FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Allow users to update their own spots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'date_spots' AND policyname = 'Allow users to update own date_spots'
  ) THEN
    CREATE POLICY "Allow users to update own date_spots" ON public.date_spots FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = created_by OR user_id IS NULL);
  END IF;
END $$;

-- Allow users to delete their own spots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'date_spots' AND policyname = 'Allow users to delete own date_spots'
  ) THEN
    CREATE POLICY "Allow users to delete own date_spots" ON public.date_spots FOR DELETE USING (auth.uid() = user_id OR auth.uid() = created_by OR user_id IS NULL);
  END IF;
END $$;

-- Grant table permissions to anon and authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.date_spots TO anon, authenticated;
