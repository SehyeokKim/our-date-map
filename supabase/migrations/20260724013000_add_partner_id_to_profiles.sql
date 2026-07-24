-- Migration: Add partner_id column to public.profiles table for targeting push notifications to specific partner

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update RLS policies to allow reading partner_id
-- Existing SELECT policy "Allow public read access to profiles" already permits reading all columns.
