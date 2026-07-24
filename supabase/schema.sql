-- 우리들의 데이트 지도 (Our Date Map) - Supabase Database & Storage Schema

-- 0. 프로필 테이블 (profiles) 생성 및 트리거 설정
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT,
    profile_image_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

GRANT ALL ON public.profiles TO anon, authenticated, service_role;

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

-- 1. 데이트 장소 테이블 (date_spots) 생성
CREATE TABLE IF NOT EXISTS public.date_spots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(), -- 작성자 회원 UUID
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- 생성자 UUID (profiles 참조)
    title VARCHAR(255) NOT NULL,                -- 장소 이름
    description TEXT,                           -- 추억/설명
    latitude DOUBLE PRECISION NOT NULL,         -- 위도
    longitude DOUBLE PRECISION NOT NULL,        -- 경도
    image_url TEXT,                             -- 업로드된 사진 URL
    image_urls TEXT[] DEFAULT '{}',             -- 사진 URL 배열
    address TEXT,                               -- 도로명/지번 주소
    visited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, -- 방문 날짜
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, -- 생성 일시
    deleted_at TIMESTAMPTZ                      -- 삭제 일시 (소프트 딜리트)
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.date_spots ENABLE ROW LEVEL SECURITY;

-- date_spots 테이블의 RLS 정책 정의
CREATE POLICY "Allow public read access to date_spots" 
ON public.date_spots 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated and public insert to date_spots" 
ON public.date_spots 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow users to update own date_spots" 
ON public.date_spots 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = created_by OR user_id IS NULL);

CREATE POLICY "Allow users to delete own date_spots" 
ON public.date_spots 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = created_by OR user_id IS NULL);

-- 테이블 권한 부여
GRANT ALL ON public.date_spots TO anon, authenticated, service_role;

-- date_spots 테이블의 deleted_at 트리거 설정 (휴지통 deleted_date_spots 자동 동기화)
CREATE OR REPLACE FUNCTION public.handle_date_spot_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
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

  IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    DELETE FROM public.deleted_date_spots
    WHERE original_spot_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_date_spot_soft_deleted ON public.date_spots;
CREATE TRIGGER on_date_spot_soft_deleted
  AFTER UPDATE OF deleted_at ON public.date_spots
  FOR EACH ROW EXECUTE FUNCTION public.handle_date_spot_soft_delete();


-- 2. Supabase Storage 스토리지 버킷 및 권한 설정
INSERT INTO storage.buckets (id, name, public)
VALUES ('date-photos', 'date-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to date-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'date-photos');

CREATE POLICY "Allow public insert access to date-photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'date-photos');

-- 프로필 사진 저장을 위한 'avatars' 퍼블릭 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow public insert access to avatars"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public update access to avatars"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'avatars');

-- 3. Web Push 알림 구독 테이블 (push_subscriptions) 생성
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

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to push_subscriptions" ON public.push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to push_subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to push_subscriptions" ON public.push_subscriptions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to push_subscriptions" ON public.push_subscriptions FOR DELETE USING (true);

GRANT ALL ON public.push_subscriptions TO anon, authenticated, service_role;

-- 4. 삭제된 데이트 장소 휴지통 테이블 (deleted_date_spots) 생성
CREATE TABLE IF NOT EXISTS public.deleted_date_spots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_spot_id UUID NOT NULL,
    spot_data JSONB NOT NULL,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reason TEXT
);

ALTER TABLE public.deleted_date_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to deleted_date_spots" ON public.deleted_date_spots FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to deleted_date_spots" ON public.deleted_date_spots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to delete own deleted_date_spots" ON public.deleted_date_spots FOR DELETE USING (auth.uid() = deleted_by OR deleted_by IS NULL);

GRANT ALL ON public.deleted_date_spots TO anon, authenticated, service_role;

-- 5. 미래 데이트 플랜 테이블 (date_plans) 생성
CREATE TABLE IF NOT EXISTS public.date_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT '미래 데이트 플랜',
    plan_date DATE NOT NULL,
    start_date DATE,
    end_date DATE,
    spots JSONB NOT NULL DEFAULT '[]'::jsonb,
    route_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.date_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to date_plans" ON public.date_plans FOR SELECT USING (true);
CREATE POLICY "Allow authenticated and public insert to date_plans" ON public.date_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to update own date_plans" ON public.date_plans FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = created_by OR user_id IS NULL);
CREATE POLICY "Allow users to delete own date_plans" ON public.date_plans FOR DELETE USING (auth.uid() = user_id OR auth.uid() = created_by OR user_id IS NULL);

GRANT ALL ON public.date_plans TO anon, authenticated, service_role;
