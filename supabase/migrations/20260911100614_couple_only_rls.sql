-- 커플 본인만 읽을 수 있도록 RLS 강화
--
-- 이전에는 대부분의 테이블이 `USING (true)`로 열려 있어 로그인하지 않은 사람도 모든 기록을 읽을 수 있었고,
-- date_spots에는 누구나 추가·수정·삭제할 수 있는 정책까지 걸려 있었다.
-- 이제 기록은 "나 또는 나와 서로를 파트너로 지정한 상대"만 읽는다.
--
-- 커플 판정은 couple_id가 아니라 **상호 파트너 지정**으로 한다.
-- couple_id는 본인 프로필에서 임의로 바꿀 수 있어 남의 커플에 끼어드는 위장이 가능하지만,
-- 상호 지정은 두 사람이 각자 자기 프로필에서 서로를 골라야만 성립한다.
--
-- 행 데이터는 변경하지 않는다. (정책·함수만 교체)

-- ── 헬퍼 함수 ────────────────────────────────────────────────
-- SECURITY DEFINER로 profiles의 RLS를 우회해 판정한다 (profiles 정책이 이 함수를 쓰므로 재귀 방지)

-- 대상 사용자가 나 자신이거나, 나와 서로를 파트너로 지정한 사람인지
CREATE OR REPLACE FUNCTION public.is_me_or_partner(target UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT target IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND (
      target = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.profiles me
        JOIN public.profiles partner ON partner.id = me.partner_id
        WHERE me.id = auth.uid()
          AND partner.id = target
          AND partner.partner_id = me.id
      )
    );
$$;

-- 대상 사용자에게 상호 지정된 파트너가 있는지 (이미 커플이면 파트너 찾기 목록에서 숨긴다)
CREATE OR REPLACE FUNCTION public.has_mutual_partner(target UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.profiles partner ON partner.id = p.partner_id
    WHERE p.id = target
      AND partner.partner_id = p.id
  );
$$;

-- 커플 공용 설정 행에 접근할 수 있는지
-- - 아직 아무도 연결되지 않은 새 커플 (생성 직후 id를 돌려받기 위해 필요)
-- - 내가 속한 커플이고, 그 커플의 다른 구성원이 없거나 나의 상호 파트너인 경우
--   (couple_id만 바꿔 끼어든 사람은 상호 파트너가 아니므로 막힌다)
CREATE OR REPLACE FUNCTION public.can_access_couple(target_couple UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      NOT EXISTS (SELECT 1 FROM public.profiles WHERE couple_id = target_couple)
      OR EXISTS (
        SELECT 1
        FROM public.profiles me
        WHERE me.id = auth.uid()
          AND me.couple_id = target_couple
          AND (
            NOT EXISTS (
              SELECT 1 FROM public.profiles other
              WHERE other.couple_id = target_couple AND other.id <> me.id
            )
            OR EXISTS (
              SELECT 1 FROM public.profiles partner
              WHERE partner.id = me.partner_id
                AND partner.partner_id = me.id
                AND partner.couple_id = target_couple
            )
          )
      )
    );
$$;

-- ── 기존 정책 전부 제거 ─────────────────────────────────────────
-- 실DB에는 schema.sql에 없는 공개 쓰기 정책까지 있어, 이름과 무관하게 모두 지우고 새로 만든다
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles', 'couples', 'date_spots', 'deleted_date_spots',
        'date_plans', 'push_subscriptions', 'push_messages'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Allow public read access to date-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access to date-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access to avatars" ON storage.objects;

-- ── profiles ──────────────────────────────────────────────────
-- 나와 상호 파트너, 그리고 파트너 찾기를 위해 아직 짝이 없는 사용자만 보인다
CREATE POLICY "Couple and unpaired users can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_me_or_partner(id) OR NOT public.has_mutual_partner(id));
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── couples ───────────────────────────────────────────────────
CREATE POLICY "Couple members can read couple"
  ON public.couples FOR SELECT TO authenticated
  USING (public.can_access_couple(id));
CREATE POLICY "Authenticated users can create couple"
  ON public.couples FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Couple members can update couple"
  ON public.couples FOR UPDATE TO authenticated
  USING (public.can_access_couple(id));

-- ── date_spots ────────────────────────────────────────────────
CREATE POLICY "Couple can read date_spots"
  ON public.date_spots FOR SELECT TO authenticated
  USING (public.is_me_or_partner(user_id) OR public.is_me_or_partner(created_by));
-- 복원 시 파트너가 작성한 원본을 되살릴 수 있도록 커플 소유 행까지 허용
CREATE POLICY "Couple can insert date_spots"
  ON public.date_spots FOR INSERT TO authenticated
  WITH CHECK (public.is_me_or_partner(COALESCE(created_by, user_id)));
CREATE POLICY "Owner can update date_spots"
  ON public.date_spots FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);
CREATE POLICY "Owner can delete date_spots"
  ON public.date_spots FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);

-- ── deleted_date_spots (휴지통) ────────────────────────────────
CREATE POLICY "Couple can read deleted_date_spots"
  ON public.deleted_date_spots FOR SELECT TO authenticated
  USING (
    public.is_me_or_partner(deleted_by)
    OR public.is_me_or_partner((spot_data->>'user_id')::uuid)
    OR public.is_me_or_partner((spot_data->>'created_by')::uuid)
  );
CREATE POLICY "Couple can insert deleted_date_spots"
  ON public.deleted_date_spots FOR INSERT TO authenticated
  WITH CHECK (public.is_me_or_partner(deleted_by));
CREATE POLICY "Deleter can delete deleted_date_spots"
  ON public.deleted_date_spots FOR DELETE TO authenticated
  USING (auth.uid() = deleted_by);

-- ── date_plans ────────────────────────────────────────────────
CREATE POLICY "Couple can read date_plans"
  ON public.date_plans FOR SELECT TO authenticated
  USING (public.is_me_or_partner(user_id) OR public.is_me_or_partner(created_by));
CREATE POLICY "Couple can insert date_plans"
  ON public.date_plans FOR INSERT TO authenticated
  WITH CHECK (public.is_me_or_partner(COALESCE(created_by, user_id)));
CREATE POLICY "Owner can update date_plans"
  ON public.date_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);
CREATE POLICY "Owner can delete date_plans"
  ON public.date_plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);

-- ── push_subscriptions ────────────────────────────────────────
-- 파트너에게 알림을 보내려면 서버(요청자 세션)가 파트너의 구독을 읽고, 만료된 구독을 지울 수 있어야 한다
CREATE POLICY "Couple can read push_subscriptions"
  ON public.push_subscriptions FOR SELECT TO authenticated
  USING (public.is_me_or_partner(user_id));
CREATE POLICY "Users can insert own push_subscriptions"
  ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push_subscriptions"
  ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Couple can delete push_subscriptions"
  ON public.push_subscriptions FOR DELETE TO authenticated
  USING (public.is_me_or_partner(user_id));

-- ── push_messages ─────────────────────────────────────────────
CREATE POLICY "Couple can read push_messages"
  ON public.push_messages FOR SELECT TO authenticated
  USING (public.is_me_or_partner(sender_id) OR public.is_me_or_partner(receiver_id));
CREATE POLICY "Sender can insert push_messages"
  ON public.push_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (receiver_id IS NULL OR public.is_me_or_partner(receiver_id))
  );
CREATE POLICY "Sender or receiver can delete push_messages"
  ON public.push_messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ── storage: date-photos ──────────────────────────────────────
-- 버킷은 공개(public URL)로 두어 기존 사진 주소는 그대로 열리지만,
-- API로 목록을 조회하는 것은 업로드한 본인과 파트너만 가능하다.
-- DELETE 정책은 이전과 같이 두지 않는다 (기존 사진 파일이 새로 지워지는 일이 없도록)
CREATE POLICY "Couple can list date-photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'date-photos' AND public.is_me_or_partner(owner));
CREATE POLICY "Authenticated users can upload date-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'date-photos');

-- ── storage: avatars (경로: <user_id>/avatar_*.ext) ──────────────
CREATE POLICY "Users can read own avatar folder"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can upload to own avatar folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
