-- 미래 데이트 플랜 테이블 (date_plans) 생성 및 RLS 정책 설정
CREATE TABLE IF NOT EXISTS public.date_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT '미래 데이트 플랜',
    plan_date DATE NOT NULL,
    spots JSONB NOT NULL DEFAULT '[]'::jsonb,
    route_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.date_plans ENABLE ROW LEVEL SECURITY;

-- RLS 정책 정의
CREATE POLICY "Allow public read access to date_plans" 
ON public.date_plans 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated and public insert to date_plans" 
ON public.date_plans 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow users to update own date_plans" 
ON public.date_plans 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = created_by OR user_id IS NULL);

CREATE POLICY "Allow users to delete own date_plans" 
ON public.date_plans 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = created_by OR user_id IS NULL);

-- 테이블 권한 부여
GRANT ALL ON public.date_plans TO anon, authenticated, service_role;
