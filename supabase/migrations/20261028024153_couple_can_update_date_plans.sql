-- 연결된 커플(서로를 partner_id로 지정한 사이)이면 누가 만든 코스든 함께 수정할 수 있게 한다.
-- 읽기 정책("Couple can read date_plans")과 같은 기준(is_me_or_partner)이다.
-- 정책만 바꾸며 행 데이터는 건드리지 않는다. 삭제는 지금처럼 작성자만 할 수 있다.

DROP POLICY IF EXISTS "Owner can update date_plans" ON public.date_plans;

CREATE POLICY "Couple can update date_plans"
  ON public.date_plans FOR UPDATE TO authenticated
  USING (public.is_me_or_partner(user_id) OR public.is_me_or_partner(created_by))
  -- 수정 후에도 작성자가 커플 안에 있어야 한다 (작성자를 다른 사람으로 바꿔 넘기는 것 방지)
  WITH CHECK (public.is_me_or_partner(user_id) OR public.is_me_or_partner(created_by));
