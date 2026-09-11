-- 우리들의 데이트 지도 (Our Date Map) - Supabase Database & Storage Schema

-- 0-a. 커플 테이블 (couples) — 두 사람이 함께 쓰는 공용 정보를 커플 단위로 모아 둔다
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    theme TEXT NOT NULL DEFAULT 'sage',
    font TEXT NOT NULL DEFAULT 'gowun-noto',
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
-- couples 정책은 헬퍼 함수가 필요해 profiles 뒤(0-b)에서 정의한다

GRANT ALL ON public.couples TO anon, authenticated, service_role;

-- 0. 프로필 테이블 (profiles) 생성 및 트리거 설정

-- 사용자 식별 태그(#0000) 발급 — 전체에서 겹치지 않는 4자리 숫자. 닉네임은 바뀔 수 있어 사용자 식별은 태그로만 한다
CREATE OR REPLACE FUNCTION public.generate_profile_tag()
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  candidate TEXT;
BEGIN
  IF (SELECT count(*) FROM public.profiles WHERE tag IS NOT NULL) >= 10000 THEN
    RAISE EXCEPTION '더 이상 발급할 수 있는 태그가 없습니다';
  END IF;
  LOOP
    candidate := lpad((floor(random() * 10000))::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE tag = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT,
    tag TEXT NOT NULL DEFAULT public.generate_profile_tag()
        CONSTRAINT profiles_tag_unique UNIQUE
        CONSTRAINT profiles_tag_format CHECK (tag ~ '^[0-9]{4}$'),
    profile_image_url TEXT,
    partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON public.profiles(couple_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.profiles TO anon, authenticated, service_role;

-- 0-b. 커플 접근 제어 헬퍼 — 커플 판정은 couple_id가 아니라 "상호 파트너 지정"으로 한다
--      (couple_id는 본인이 임의로 바꿀 수 있어 위장이 가능하다). SECURITY DEFINER로 profiles RLS 재귀를 피한다
CREATE OR REPLACE FUNCTION public.is_me_or_partner(target UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT target IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND (
      target = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.profiles me
        JOIN public.profiles partner ON partner.id = me.partner_id
        WHERE me.id = auth.uid() AND partner.id = target AND partner.partner_id = me.id
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.has_mutual_partner(target UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.profiles partner ON partner.id = p.partner_id
    WHERE p.id = target AND partner.partner_id = p.id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_couple(target_couple UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      NOT EXISTS (SELECT 1 FROM public.profiles WHERE couple_id = target_couple)
      OR EXISTS (
        SELECT 1
        FROM public.profiles me
        WHERE me.id = auth.uid()
          AND me.couple_id = target_couple
          AND (
            NOT EXISTS (SELECT 1 FROM public.profiles other WHERE other.couple_id = target_couple AND other.id <> me.id)
            OR EXISTS (
              SELECT 1 FROM public.profiles partner
              WHERE partner.id = me.partner_id AND partner.partner_id = me.id AND partner.couple_id = target_couple
            )
          )
      )
    );
$$;

-- 다른 사람의 프로필은 상호 파트너만 볼 수 있다 (상대는 목록이 아니라 태그로 찾는다)
CREATE POLICY "Couple can read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_me_or_partner(id));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 커플 행은 연결 수락 함수(respond_partner_request)가 만든다 — 클라이언트 INSERT 정책 없음
CREATE POLICY "Couple members can read couple" ON public.couples FOR SELECT TO authenticated USING (public.can_access_couple(id));
CREATE POLICY "Couple members can update couple" ON public.couples FOR UPDATE TO authenticated USING (public.can_access_couple(id));

-- 0-c. 커플 연결 요청·수락 — partner_id·couple_id·tag는 아래 함수로만 바뀐다
CREATE OR REPLACE FUNCTION public.guard_profile_link_columns()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_setting('app.partner_link', true) IS DISTINCT FROM 'on' AND (
    NEW.partner_id IS DISTINCT FROM OLD.partner_id
    OR NEW.couple_id IS DISTINCT FROM OLD.couple_id
    OR NEW.tag IS DISTINCT FROM OLD.tag
  ) THEN
    RAISE EXCEPTION '커플 연결과 태그는 연결 요청·수락으로만 바꿀 수 있어요';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_link_columns ON public.profiles;
CREATE TRIGGER guard_profile_link_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_link_columns();

CREATE TABLE IF NOT EXISTS public.partner_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    responded_at TIMESTAMPTZ,
    CONSTRAINT partner_requests_not_self CHECK (requester_id <> target_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_requests_one_pending
  ON public.partner_requests (requester_id, target_id) WHERE status = 'pending';

ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- 읽기만 당사자에게 허용하고, 생성·응답·취소는 함수로만 한다
CREATE POLICY "Requester or target can read partner_requests" ON public.partner_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- 연결 함수 (로그인 사용자만 실행 가능, 본문은 20260911102320_partner_tags_and_requests.sql 참조)
--   send_partner_request(p_tag)                  태그로 요청 보내기 — 상대 닉네임·사진은 돌려주지 않는다
--   respond_partner_request(p_request_id, p_accept) 받은 요청 수락/거절 — 수락 시 서로를 파트너로 지정하고 새 커플 생성
--   cancel_partner_request(p_request_id)         보낸 요청 취소
--   disconnect_partner()                         커플 연결 해제 (기록은 지우지 않음)
--   get_partner_requests()                       대기 중인 요청 — 받은 요청은 보낸 사람 닉네임·사진, 보낸 요청은 태그만

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
    video_urls TEXT[] DEFAULT '{}',             -- 동영상 URL 배열
    address TEXT,                               -- 도로명/지번 주소
    visited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, -- 방문 날짜
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, -- 생성 일시
    deleted_at TIMESTAMPTZ                      -- 삭제 일시 (소프트 딜리트)
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.date_spots ENABLE ROW LEVEL SECURITY;

-- date_spots 테이블의 RLS 정책 정의 — 읽기는 커플, 수정·삭제는 작성자 본인
CREATE POLICY "Couple can read date_spots" ON public.date_spots FOR SELECT TO authenticated
  USING (public.is_me_or_partner(user_id) OR public.is_me_or_partner(created_by));
CREATE POLICY "Couple can insert date_spots" ON public.date_spots FOR INSERT TO authenticated
  WITH CHECK (public.is_me_or_partner(COALESCE(created_by, user_id)));
CREATE POLICY "Owner can update date_spots" ON public.date_spots FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);
CREATE POLICY "Owner can delete date_spots" ON public.date_spots FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);

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

-- 공개 버킷이라 사진 주소(public URL)는 열리지만, API 목록 조회는 업로드한 본인·파트너만 가능하다 (DELETE 정책 없음)
CREATE POLICY "Couple can list date-photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'date-photos' AND public.is_me_or_partner(owner));
CREATE POLICY "Authenticated users can upload date-photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'date-photos');

-- 프로필 사진 저장을 위한 'avatars' 퍼블릭 버킷 생성 (경로: <user_id>/avatar_*.ext)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own avatar folder" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can upload to own avatar folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar folder" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

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

-- 파트너에게 알림을 보내려면 서버(요청자 세션)가 파트너의 구독을 읽고 만료 구독을 지울 수 있어야 한다
CREATE POLICY "Couple can read push_subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated
  USING (public.is_me_or_partner(user_id));
CREATE POLICY "Users can insert own push_subscriptions" ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push_subscriptions" ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Couple can delete push_subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated
  USING (public.is_me_or_partner(user_id));

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

CREATE POLICY "Couple can read deleted_date_spots" ON public.deleted_date_spots FOR SELECT TO authenticated
  USING (
    public.is_me_or_partner(deleted_by)
    OR public.is_me_or_partner((spot_data->>'user_id')::uuid)
    OR public.is_me_or_partner((spot_data->>'created_by')::uuid)
  );
CREATE POLICY "Couple can insert deleted_date_spots" ON public.deleted_date_spots FOR INSERT TO authenticated
  WITH CHECK (public.is_me_or_partner(deleted_by));
CREATE POLICY "Deleter can delete deleted_date_spots" ON public.deleted_date_spots FOR DELETE TO authenticated
  USING (auth.uid() = deleted_by);

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

CREATE POLICY "Couple can read date_plans" ON public.date_plans FOR SELECT TO authenticated
  USING (public.is_me_or_partner(user_id) OR public.is_me_or_partner(created_by));
CREATE POLICY "Couple can insert date_plans" ON public.date_plans FOR INSERT TO authenticated
  WITH CHECK (public.is_me_or_partner(COALESCE(created_by, user_id)));
CREATE POLICY "Owner can update date_plans" ON public.date_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);
CREATE POLICY "Owner can delete date_plans" ON public.date_plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);

GRANT ALL ON public.date_plans TO anon, authenticated, service_role;

-- 6. 푸시 알림 메세지 이력 테이블 (push_messages) 생성
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

ALTER TABLE public.push_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple can read push_messages" ON public.push_messages FOR SELECT TO authenticated
  USING (public.is_me_or_partner(sender_id) OR public.is_me_or_partner(receiver_id));
CREATE POLICY "Sender can insert push_messages" ON public.push_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND (receiver_id IS NULL OR public.is_me_or_partner(receiver_id)));
CREATE POLICY "Sender or receiver can delete push_messages" ON public.push_messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

GRANT ALL ON public.push_messages TO anon, authenticated, service_role;
