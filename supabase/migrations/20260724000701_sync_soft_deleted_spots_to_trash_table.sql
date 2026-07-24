-- Migration: Sync date_spots with deleted_at IS NOT NULL automatically to deleted_date_spots table

-- 1. Create Trigger function for soft deletion and restoration sync
CREATE OR REPLACE FUNCTION public.handle_date_spot_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- When deleted_at is updated from NULL to NOT NULL (soft deleted)
  IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) THEN
    INSERT INTO public.deleted_date_spots (
      original_spot_id,
      spot_data,
      deleted_by,
      deleted_at,
      reason
    )
    VALUES (
      NEW.id,
      to_jsonb(NEW),
      COALESCE(auth.uid(), NEW.created_by, NEW.user_id),
      NEW.deleted_at,
      '소프트 삭제 요청'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- When deleted_at is restored back to NULL
  IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    DELETE FROM public.deleted_date_spots
    WHERE original_spot_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach trigger to date_spots table
DROP TRIGGER IF EXISTS on_date_spot_soft_deleted ON public.date_spots;
CREATE TRIGGER on_date_spot_soft_deleted
  AFTER UPDATE OF deleted_at ON public.date_spots
  FOR EACH ROW EXECUTE FUNCTION public.handle_date_spot_soft_delete();

-- 3. Backfill existing date_spots where deleted_at IS NOT NULL into deleted_date_spots
INSERT INTO public.deleted_date_spots (
  original_spot_id,
  spot_data,
  deleted_by,
  deleted_at,
  reason
)
SELECT 
  ds.id AS original_spot_id,
  to_jsonb(ds) AS spot_data,
  COALESCE(ds.created_by, ds.user_id) AS deleted_by,
  ds.deleted_at AS deleted_at,
  '과거 삭제 기록' AS reason
FROM public.date_spots ds
WHERE ds.deleted_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.deleted_date_spots dds WHERE dds.original_spot_id = ds.id
  );
