-- Migration: Decouple creator metadata from date_spots to public.profiles table

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT,
    profile_image_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Define RLS Policies for profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow public read access to profiles'
  ) THEN
    CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow users to insert own profile'
  ) THEN
    CREATE POLICY "Allow users to insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow users to update own profile'
  ) THEN
    CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

GRANT ALL ON public.profiles TO anon, authenticated, service_role;

-- 3. Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, profile_image_url, updated_at, created_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'profile_image_url',
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill profiles for existing users and date_spots creators
INSERT INTO public.profiles (id, nickname, profile_image_url, updated_at, created_at)
SELECT 
  id,
  COALESCE(
    raw_user_meta_data->>'nickname',
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ) AS nickname,
  COALESCE(
    raw_user_meta_data->>'profile_image_url',
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'picture'
  ) AS profile_image_url,
  NOW(),
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'date_spots' AND column_name = 'creator_nickname'
  ) THEN
    INSERT INTO public.profiles (id, nickname, profile_image_url, updated_at, created_at)
    SELECT DISTINCT
      COALESCE(created_by, user_id) as id,
      creator_nickname as nickname,
      creator_avatar_url as profile_image_url,
      NOW(),
      NOW()
    FROM public.date_spots
    WHERE COALESCE(created_by, user_id) IS NOT NULL
      AND (creator_nickname IS NOT NULL OR creator_avatar_url IS NOT NULL)
    ON CONFLICT (id) DO UPDATE SET
      nickname = COALESCE(public.profiles.nickname, EXCLUDED.nickname),
      profile_image_url = COALESCE(public.profiles.profile_image_url, EXCLUDED.profile_image_url);
  END IF;
END $$;

-- 5. Clean up date_spots table
UPDATE public.date_spots
SET created_by = user_id
WHERE created_by IS NULL AND user_id IS NOT NULL;

ALTER TABLE public.date_spots
  DROP CONSTRAINT IF EXISTS date_spots_created_by_fkey,
  DROP CONSTRAINT IF EXISTS date_spots_created_by_profiles_fkey;

ALTER TABLE public.date_spots
  ADD CONSTRAINT date_spots_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.date_spots
  DROP COLUMN IF EXISTS creator_nickname,
  DROP COLUMN IF EXISTS creator_avatar_url,
  DROP COLUMN IF EXISTS creator_profile_image;
