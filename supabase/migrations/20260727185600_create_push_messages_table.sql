-- 푸시 알림 메세지 이력 테이블 (push_messages) 생성 및 RLS 정책 설정
CREATE TABLE IF NOT EXISTS public.push_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_name VARCHAR(255) NOT NULL DEFAULT '익명',
    title VARCHAR(255) NOT NULL DEFAULT 'DateMap😘',
    body TEXT NOT NULL DEFAULT '뽁!',
    url VARCHAR(500) DEFAULT '/',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.push_messages ENABLE ROW LEVEL SECURITY;

-- RLS 정책 정의
CREATE POLICY "Allow public read access to push_messages" 
ON public.push_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated and public insert to push_messages" 
ON public.push_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow users to delete own sent or received push_messages" 
ON public.push_messages 
FOR DELETE 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR sender_id IS NULL);

-- 테이블 권한 부여
GRANT ALL ON public.push_messages TO anon, authenticated, service_role;
