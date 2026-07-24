-- date_plans 테이블에 start_date 및 end_date 날짜 범위 컬럼 추가
ALTER TABLE public.date_plans
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 기존 레코드의 start_date 및 end_date를 plan_date 값으로 백필
UPDATE public.date_plans
SET start_date = COALESCE(start_date, plan_date),
    end_date = COALESCE(end_date, plan_date)
WHERE start_date IS NULL OR end_date IS NULL;
