-- Create RLS policies for UPDATE and DELETE operations on date_spots table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'date_spots' AND policyname = 'Allow public update access to date_spots'
    ) THEN
        CREATE POLICY "Allow public update access to date_spots"
        ON public.date_spots FOR UPDATE USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'date_spots' AND policyname = 'Allow public delete access to date_spots'
    ) THEN
        CREATE POLICY "Allow public delete access to date_spots"
        ON public.date_spots FOR DELETE USING (true);
    END IF;
END $$;
