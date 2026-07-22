-- 우리들의 데이트 지도 (Our Date Map) - Supabase Database & Storage Schema

-- 1. 데이트 장소 테이블 (date_spots) 생성
CREATE TABLE IF NOT EXISTS public.date_spots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                -- 장소 이름
    description TEXT,                           -- 추억/설명
    latitude DOUBLE PRECISION NOT NULL,         -- 위도
    longitude DOUBLE PRECISION NOT NULL,        -- 경도
    image_url TEXT,                             -- 업로드된 사진 URL
    address TEXT,                               -- 도로명/지번 주소
    visited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, -- 방문 날짜
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL  -- 생성 일시
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.date_spots ENABLE ROW LEVEL SECURITY;

-- date_spots 테이블의 RLS 정책 정의
-- 누구나 등록된 데이트 장소를 조회할 수 있도록 허용 (SELECT)
CREATE POLICY "Allow public read access to date_spots" 
ON public.date_spots 
FOR SELECT 
USING (true);

-- 누구나 새로운 데이트 장소를 등록할 수 있도록 허용 (INSERT)
-- (실제 서비스에서는 로그인한 사용자만 가능하도록 제한하는 것이 일반적이나, 현재는 클라이언트 익명 권한 기반으로 허용)
CREATE POLICY "Allow public insert access to date_spots" 
ON public.date_spots 
FOR INSERT 
WITH CHECK (true);

-- 테이블 권한 부여 (API 요청을 처리하기 위해 anon, authenticated, service_role에 권한 부여)
GRANT ALL ON public.date_spots TO anon, authenticated, service_role;



-- 2. Supabase Storage 스토리지 버킷 및 권한 설정
-- 사진 저장을 위한 'date-photos' 퍼블릭 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('date-photos', 'date-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 스토리지 오브젝트(storage.objects) RLS 정책 정의
-- 누구나 'date-photos' 버킷에 업로드된 사진을 볼 수 있도록 허용 (SELECT)
CREATE POLICY "Allow public read access to date-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'date-photos');

-- 누구나 'date-photos' 버킷에 새로운 사진을 업로드할 수 있도록 허용 (INSERT)
CREATE POLICY "Allow public insert access to date-photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'date-photos');
