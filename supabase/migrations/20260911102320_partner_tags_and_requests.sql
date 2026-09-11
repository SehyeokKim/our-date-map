-- 사용자 태그(#0000) & 커플 연결 요청·수락
--
-- - 모든 사용자에게 전체에서 겹치지 않는 4자리 숫자 태그를 붙인다. 닉네임은 바뀔 수 있으므로 사용자 식별은 태그로만 한다.
-- - 커플 연결은 상대방 태그로 요청을 보내고, 상대방이 수락해야 성립한다. (목록에서 고르는 방식 폐지)
-- - partner_id · couple_id · tag는 아래 함수들을 통해서만 바뀐다. 사용자가 프로필을 직접 수정해 바꿀 수 없다.
--
-- 기존 행에 대한 변경은 새 tag 컬럼을 채우는 것뿐이다. (닉네임·사진·파트너·커플 값은 그대로)

-- ── 태그 ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_profile_tag()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
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

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tag TEXT;

-- 기존 사용자에게 태그 발급 (한 행씩 처리해 서로 겹치지 않게 한다)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE tag IS NULL ORDER BY created_at LOOP
    UPDATE public.profiles SET tag = public.generate_profile_tag() WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE public.profiles ALTER COLUMN tag SET DEFAULT public.generate_profile_tag();
ALTER TABLE public.profiles ALTER COLUMN tag SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tag_format CHECK (tag ~ '^[0-9]{4}$');
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tag_unique UNIQUE (tag);

-- ── 연결 관련 컬럼 보호 ─────────────────────────────────────────
-- 연결 함수는 트랜잭션 로컬 설정 app.partner_link = 'on'을 켜고 수정한다. 그 밖의 수정에서 값이 바뀌면 거부한다.
-- (값을 그대로 다시 보내는 기존 프로필 저장 요청은 통과한다)
CREATE OR REPLACE FUNCTION public.guard_profile_link_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
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

-- ── 연결 요청 테이블 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  CONSTRAINT partner_requests_not_self CHECK (requester_id <> target_id)
);

-- 같은 사람에게 대기 중인 요청은 하나만
CREATE UNIQUE INDEX IF NOT EXISTS partner_requests_one_pending
  ON public.partner_requests (requester_id, target_id)
  WHERE status = 'pending';

ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- 읽기만 당사자에게 허용하고, 생성·응답·취소는 아래 함수로만 한다
CREATE POLICY "Requester or target can read partner_requests"
  ON public.partner_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- ── profiles 읽기 범위 축소 ─────────────────────────────────────
-- 파트너 찾기 목록이 없어졌으므로, 다른 사람의 프로필은 상호 파트너만 볼 수 있다
DROP POLICY IF EXISTS "Couple and unpaired users can read profiles" ON public.profiles;
CREATE POLICY "Couple can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_me_or_partner(id));

-- 커플은 연결 수락 시 함수가 만든다
DROP POLICY IF EXISTS "Authenticated users can create couple" ON public.couples;

-- ── 연결 함수 ──────────────────────────────────────────────────

-- 태그로 연결 요청 보내기. 상대방의 닉네임·사진은 돌려주지 않는다 (태그를 무작위로 넣어 프로필을 알아내지 못하게)
CREATE OR REPLACE FUNCTION public.send_partner_request(p_tag TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  me UUID := auth.uid();
  normalized TEXT := regexp_replace(coalesce(p_tag, ''), '[^0-9]', '', 'g');
  target UUID;
  request_id UUID;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION '로그인이 필요해요';
  END IF;
  IF normalized !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION '태그는 숫자 4자리로 입력해 주세요';
  END IF;

  SELECT id INTO target FROM public.profiles WHERE tag = normalized;
  IF target IS NULL THEN
    RAISE EXCEPTION '해당 태그의 사용자를 찾을 수 없어요';
  END IF;
  IF target = me THEN
    RAISE EXCEPTION '내 태그로는 요청할 수 없어요';
  END IF;
  IF public.has_mutual_partner(me) THEN
    RAISE EXCEPTION '이미 커플로 연결돼 있어요. 연결을 해제한 뒤 요청해 주세요';
  END IF;
  IF public.has_mutual_partner(target) THEN
    RAISE EXCEPTION '상대방이 이미 다른 사람과 연결돼 있어요';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.partner_requests
    WHERE requester_id = target AND target_id = me AND status = 'pending'
  ) THEN
    RAISE EXCEPTION '상대방이 이미 요청을 보냈어요. 받은 요청에서 수락해 주세요';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.partner_requests
    WHERE requester_id = me AND target_id = target AND status = 'pending'
  ) THEN
    RAISE EXCEPTION '이미 요청을 보냈어요. 상대방의 수락을 기다려 주세요';
  END IF;

  INSERT INTO public.partner_requests (requester_id, target_id)
  VALUES (me, target)
  RETURNING id INTO request_id;

  RETURN request_id;
END;
$$;

-- 받은 요청에 응답하기. 수락하면 두 사람을 서로의 파트너로 지정하고 새 커플(공용 설정)을 만든다
CREATE OR REPLACE FUNCTION public.respond_partner_request(p_request_id UUID, p_accept BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  me UUID := auth.uid();
  req public.partner_requests%ROWTYPE;
  new_couple UUID;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION '로그인이 필요해요';
  END IF;

  SELECT * INTO req FROM public.partner_requests
  WHERE id = p_request_id AND target_id = me AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION '처리할 수 있는 요청이 없어요';
  END IF;

  IF NOT p_accept THEN
    UPDATE public.partner_requests SET status = 'declined', responded_at = NOW() WHERE id = req.id;
    RETURN;
  END IF;

  IF public.has_mutual_partner(me) THEN
    RAISE EXCEPTION '이미 커플로 연결돼 있어요. 연결을 해제한 뒤 수락해 주세요';
  END IF;
  IF public.has_mutual_partner(req.requester_id) THEN
    RAISE EXCEPTION '상대방이 이미 다른 사람과 연결됐어요';
  END IF;

  INSERT INTO public.couples DEFAULT VALUES RETURNING id INTO new_couple;

  PERFORM set_config('app.partner_link', 'on', true);
  UPDATE public.profiles SET partner_id = req.requester_id, couple_id = new_couple, updated_at = NOW() WHERE id = me;
  UPDATE public.profiles SET partner_id = me, couple_id = new_couple, updated_at = NOW() WHERE id = req.requester_id;
  PERFORM set_config('app.partner_link', 'off', true);

  UPDATE public.partner_requests SET status = 'accepted', responded_at = NOW() WHERE id = req.id;

  -- 두 사람과 관련된 나머지 대기 요청은 정리한다
  UPDATE public.partner_requests
  SET status = 'canceled', responded_at = NOW()
  WHERE status = 'pending'
    AND (requester_id IN (me, req.requester_id) OR target_id IN (me, req.requester_id));
END;
$$;

-- 보낸 요청 취소하기
CREATE OR REPLACE FUNCTION public.cancel_partner_request(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION '로그인이 필요해요';
  END IF;
  UPDATE public.partner_requests
  SET status = 'canceled', responded_at = NOW()
  WHERE id = p_request_id AND requester_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION '취소할 수 있는 요청이 없어요';
  END IF;
END;
$$;

-- 커플 연결 해제하기. 두 사람의 연결만 끊고, 기록은 지우지 않는다
CREATE OR REPLACE FUNCTION public.disconnect_partner()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  me UUID := auth.uid();
  partner UUID;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION '로그인이 필요해요';
  END IF;

  SELECT p.partner_id INTO partner FROM public.profiles p WHERE p.id = me;
  IF partner IS NULL THEN
    RAISE EXCEPTION '연결된 상대가 없어요';
  END IF;

  PERFORM set_config('app.partner_link', 'on', true);
  UPDATE public.profiles SET partner_id = NULL, couple_id = NULL, updated_at = NOW() WHERE id = me;
  -- 상대방도 나를 가리키고 있을 때만 함께 끊는다
  UPDATE public.profiles SET partner_id = NULL, couple_id = NULL, updated_at = NOW()
  WHERE id = partner AND partner_id = me;
  PERFORM set_config('app.partner_link', 'off', true);
END;
$$;

-- 대기 중인 요청 목록. 받은 요청은 보낸 사람의 닉네임·사진을, 보낸 요청은 상대 태그만 보여준다
CREATE OR REPLACE FUNCTION public.get_partner_requests()
RETURNS TABLE (
  id UUID,
  direction TEXT,
  created_at TIMESTAMPTZ,
  other_tag TEXT,
  other_nickname TEXT,
  other_avatar_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    r.id,
    CASE WHEN r.target_id = auth.uid() THEN 'received' ELSE 'sent' END,
    r.created_at,
    other.tag,
    CASE WHEN r.target_id = auth.uid() THEN other.nickname END,
    CASE WHEN r.target_id = auth.uid() THEN other.profile_image_url END
  FROM public.partner_requests r
  JOIN public.profiles other
    ON other.id = CASE WHEN r.target_id = auth.uid() THEN r.requester_id ELSE r.target_id END
  WHERE r.status = 'pending'
    AND auth.uid() IS NOT NULL
    AND (r.requester_id = auth.uid() OR r.target_id = auth.uid())
  ORDER BY r.created_at DESC;
$$;

-- 연결 함수는 로그인 사용자만 호출할 수 있다
REVOKE EXECUTE ON FUNCTION public.send_partner_request(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.respond_partner_request(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_partner_request(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.disconnect_partner() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_partner_requests() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_profile_tag() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_partner_request(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_partner_request(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_partner_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_partner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_requests() TO authenticated;
