# [Task 08] Kakao OAuth 인증 연동 & 데이트 장소 작성자 추적 (Creator Tracking)

## 📌 작업 개요
- **버전:** `v0.4.0`
- **구현일:** 2026-07-23
- **주요 목적:** Kakao OAuth 인증 시스템(Supabase `@supabase/ssr`)을 구축하여 사용자가 카카오 계정으로 간편하게 로그인할 수 있도록 하고, 데이트 핀 등록 시 작성자의 닉네임, 프로필 이미지 및 ID를 기록 및 상세 뷰에 표시합니다.

---

## 🛠️ 세부 요구사항 & 구현 내역

### 1. 데이터베이스 스키마 마이그레이션 (`supabase/migrations/`)
- 신규 마이그레이션 파일 `20260723000000_add_creator_to_date_spots.sql` 추가.
- `date_spots` 테이블에 작성자 추적 컬럼 추가:
  - `created_by`: `UUID REFERENCES auth.users(id)`
  - `creator_nickname`: `TEXT`
  - `creator_avatar_url`: `TEXT`
- Remote Supabase DB에 `npx supabase db push` 연동 적용 및 TypeScript 타입 자동 생성 (`src/types/supabase.ts`).

### 2. Supabase Auth Helpers & Client/Server SSR (`@supabase/ssr`)
- Browser Client (`src/lib/supabase/client.ts`) 및 Server Client (`src/lib/supabase/server.ts`) 구현.
- 카카오 로그인 지원 함수 `signInWithKakao()` 구현 (Redirect URL: `/auth/callback`).
- Auth Callback Route Handler (`src/app/auth/callback/route.ts`) 구현하여 OAuth 인증 `code`를 세션으로 교환 처리.

### 3. UI 및 상태 연동
- 커스텀 훅 `useAuth.ts` 추가로 세션 및 사용자 닉네임/프로필 상태 관리.
- 헤더 드롭다운 메뉴 (`Header.tsx`):
  - 미인증 시: `카카오로 3초 로그인 (작성자 기록)` 버튼 표시.
  - 인증 시: 사용자 프로필 이미지, 닉네임 및 `로그아웃` 버튼 표시.
- 데이트 장소 남기기 모달 (`AddSpotModal.tsx`): 로그인된 경우 작성자 프로필 및 닉네임 정보를 자동으로 핀 생성 페이로드에 첨부.
- 상세 보기 시트 (`SpotDetailSheet.tsx`): 핀 상세 정보 상단에 작성자 배지 ("작성자: OO") 표시.
