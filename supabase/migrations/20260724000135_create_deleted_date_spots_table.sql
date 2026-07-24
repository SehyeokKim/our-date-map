-- Migration: Create deleted_date_spots trash bin table & RLS policies

CREATE TABLE IF NOT EXISTS public.deleted_date_spots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_spot_id UUID NOT NULL,
    spot_data JSONB NOT NULL,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reason TEXT
);

-- Enable RLS on deleted_date_spots table
ALTER TABLE public.deleted_date_spots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deleted_date_spots' AND policyname = 'Allow public read access to deleted_date_spots'
  ) THEN
    CREATE POLICY "Allow public read access to deleted_date_spots" ON public.deleted_date_spots FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deleted_date_spots' AND policyname = 'Allow public insert access to deleted_date_spots'
  ) THEN
    CREATE POLICY "Allow public insert access to deleted_date_spots" ON public.deleted_date_spots FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deleted_date_spots' AND policyname = 'Allow users to delete own deleted_date_spots'
  ) THEN
    CREATE POLICY "Allow users to delete own deleted_date_spots" ON public.deleted_date_spots FOR DELETE USING (auth.uid() = deleted_by OR deleted_by IS NULL);
  END IF;
END $$;

GRANT ALL ON public.deleted_date_spots TO anon, authenticated, service_role;
