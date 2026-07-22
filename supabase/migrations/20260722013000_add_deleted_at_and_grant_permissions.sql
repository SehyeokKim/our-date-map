-- Add deleted_at column for soft-delete functionality
ALTER TABLE public.date_spots ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Grant full table permissions (SELECT, INSERT, UPDATE, DELETE) to anon, authenticated, and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.date_spots TO anon, authenticated, service_role;
