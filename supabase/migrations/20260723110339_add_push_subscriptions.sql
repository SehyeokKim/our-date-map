-- Create push_subscriptions table for storing Web Push Notifications subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS (Row Level Security) Configuration
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for push_subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Allow public read access to push_subscriptions'
  ) THEN
    CREATE POLICY "Allow public read access to push_subscriptions" ON public.push_subscriptions FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Allow public insert access to push_subscriptions'
  ) THEN
    CREATE POLICY "Allow public insert access to push_subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Allow public update access to push_subscriptions'
  ) THEN
    CREATE POLICY "Allow public update access to push_subscriptions" ON public.push_subscriptions FOR UPDATE USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Allow public delete access to push_subscriptions'
  ) THEN
    CREATE POLICY "Allow public delete access to push_subscriptions" ON public.push_subscriptions FOR DELETE USING (true);
  END IF;
END $$;

-- Grant permissions to anon, authenticated, and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO anon, authenticated, service_role;
