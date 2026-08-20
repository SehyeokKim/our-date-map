# Task 25 — 커플 단위 공용 설정 (couples 테이블)

## 목표
배포 시 여러 커플을 관리해야 하므로 커플을 하나의 id로 묶는 테이블을 만들고, 두 사람이 함께 쓰는 정보를 그곳에 모은다. 첫 공용 항목은 **테마·폰트**로, 한 사람이 바꾸면 상대방에게도 적용된다.

## DB 설계 (`!DB` 적용 완료)
- `public.couples` — `id`, `theme`, `font`, `updated_by`(마지막 변경자), `created_at`, `updated_at`
- `public.profiles.couple_id` → `couples(id)` (`ON DELETE SET NULL`) + 인덱스
- RLS: 읽기는 공개(프로젝트 관례), **수정은 해당 커플 구성원만**(구성원이 아직 없는 신규 커플은 예외 허용)
- 백필: 기존 파트너 지정 관계 중 `couple_id`가 비어 있는 쌍만 커플 생성 후 연결 (추가 전용, 기존 값 미변경)
- 마이그레이션: `supabase/migrations/20260820073030_create_couples_and_shared_settings.sql`

## 앱 연동
- `src/lib/couple.ts` — `ensureCouple` / `fetchCoupleSettings` / `saveCoupleTheme`
- `useAuth.updateProfile` — 파트너 지정 시 `ensureCouple` 호출(실패해도 프로필 저장은 유지)
- `useTheme(userId)` — 로그인 시 커플 설정을 받아 적용(로컬값 덮어씀), 테마 적용 시 `couples`에 저장
- `SettingsModal` — 커플로 묶여 있으면 "상대방과 함께 적용돼요" 안내

## 확장 지침
공용 항목이 늘어나면 `couples`에 컬럼을 추가하고 `CoupleSettings`에 필드를 더한다. 개인별로 달라야 하는 값은 `profiles`에 둔다.

## 남은 과제 (후속)
- **실시간 반영**: 현재는 앱을 새로 열거나 새로고침할 때 상대의 변경이 반영된다. 즉시 반영하려면 `couples`에 Supabase Realtime 구독을 붙여야 한다(publication 설정 필요).
- **커플 해제/재지정**: 파트너를 바꾸면 이전 커플에 남은 `couple_id` 정리 로직이 없다.
- **커플 초대 흐름**: 지금은 프로필 수정에서 상대를 직접 고르는 방식이라, 배포 시에는 초대 코드 등 상호 동의 절차가 필요하다.
