-- Add creator tracking columns to date_spots table
ALTER TABLE date_spots 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS creator_nickname TEXT,
  ADD COLUMN IF NOT EXISTS creator_avatar_url TEXT;

-- Grant permissions for anon and authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON date_spots TO anon, authenticated;
