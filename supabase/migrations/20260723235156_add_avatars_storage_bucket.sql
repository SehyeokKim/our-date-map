-- Create 'avatars' storage bucket for user profile avatar photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies on storage.objects for 'avatars' bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public read access to avatars'
  ) THEN
    CREATE POLICY "Allow public read access to avatars"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public insert access to avatars'
  ) THEN
    CREATE POLICY "Allow public insert access to avatars"
    ON storage.objects
    FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public update access to avatars'
  ) THEN
    CREATE POLICY "Allow public update access to avatars"
    ON storage.objects
    FOR UPDATE
    TO public
    USING (bucket_id = 'avatars');
  END IF;
END $$;
