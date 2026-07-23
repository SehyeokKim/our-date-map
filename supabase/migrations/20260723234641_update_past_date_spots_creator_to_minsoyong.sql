-- Migration: Update creator of all past date_spots to 민소영 in public.profiles

DO $$
DECLARE
  minsoyong_id UUID;
BEGIN
  -- Get user ID of 민소영 from profiles table
  SELECT id INTO minsoyong_id
  FROM public.profiles
  WHERE nickname = '민소영'
  LIMIT 1;

  IF minsoyong_id IS NOT NULL THEN
    UPDATE public.date_spots
    SET 
      created_by = minsoyong_id,
      user_id = minsoyong_id;
  END IF;
END $$;
