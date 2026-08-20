-- Migration: 커플 단위 공용 정보를 담는 public.couples 테이블 생성 및 프로필 연결
--
-- 배포 시 여러 커플을 관리해야 하므로, 두 사람이 함께 쓰는 설정을 개인 프로필이 아닌
-- 커플 단위로 모아 둔다. 첫 공용 항목은 테마(theme)와 폰트(font)이며,
-- 이후 공용 설정이 늘어나면 이 테이블에 컬럼을 추가한다.

-- 1. 커플 테이블
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- 공용 테마 설정 (src/lib/theme.ts의 COLOR_THEMES / FONT_THEMES와 값이 일치해야 함)
    theme TEXT NOT NULL DEFAULT 'sage',
    font TEXT NOT NULL DEFAULT 'gowun-noto',
    -- 마지막으로 설정을 바꾼 사람 (누가 바꿨는지 UI에서 안내할 수 있도록)
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. 프로필 → 커플 연결 (아래 RLS 정책이 이 컬럼을 참조하므로 정책보다 먼저 추가한다)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON public.profiles(couple_id);

-- 3. RLS — 프로젝트 관례(공개 읽기)를 따르되, 수정은 해당 커플에 속한 사람만 가능하게 한다.
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to couples" ON public.couples;
CREATE POLICY "Allow public read access to couples"
    ON public.couples FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to couples" ON public.couples;
CREATE POLICY "Allow authenticated insert to couples"
    ON public.couples FOR INSERT WITH CHECK (true);

-- 아직 아무도 연결되지 않은 커플(생성 직후)도 갱신할 수 있도록 예외를 둔다.
DROP POLICY IF EXISTS "Allow couple members to update couples" ON public.couples;
CREATE POLICY "Allow couple members to update couples"
    ON public.couples FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.couple_id = couples.id AND p.id = auth.uid()
        )
        OR NOT EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.couple_id = couples.id
        )
    );

GRANT ALL ON public.couples TO anon, authenticated, service_role;

-- 4. 기존 파트너 지정 관계를 커플로 백필
--    couple_id가 비어 있는 쌍에 대해서만 커플을 새로 만들어 연결한다.
--    기존 컬럼 값을 덮어쓰거나 삭제하지 않는 추가 전용(additive) 작업이다.
DO $$
DECLARE
    rec RECORD;
    new_couple_id UUID;
BEGIN
    FOR rec IN
        SELECT DISTINCT
            LEAST(p.id, q.id)    AS a_id,
            GREATEST(p.id, q.id) AS b_id
        FROM public.profiles p
        JOIN public.profiles q ON q.id = p.partner_id
        WHERE p.couple_id IS NULL
          AND q.couple_id IS NULL
          AND p.id <> q.id
    LOOP
        INSERT INTO public.couples DEFAULT VALUES RETURNING id INTO new_couple_id;
        UPDATE public.profiles
        SET couple_id = new_couple_id
        WHERE id IN (rec.a_id, rec.b_id) AND couple_id IS NULL;
    END LOOP;
END $$;
