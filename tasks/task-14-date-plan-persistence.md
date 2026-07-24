# [Task 14] 날짜 선택 기반 미래 데이트 플랜 생성 및 Supabase DB 영구 저장 파이프라인

## 1. 개요 (Overview)
- **작성일:** 2026-07-24
- **버전:** `v0.7.0`
- **목적:** 미래 데이트 플래닝 모드에서 원하는 날짜(`plan_date`)를 선택하여 장소 코스를 구성하고, 작성된 플랜을 Supabase PostgreSQL `public.date_plans` 테이블에 영구 저장 및 언제든지 불러올 수 있도록 구현합니다.

## 2. 데이터베이스 마이그레이션 (`!DB`)
- **테이블명:** `public.date_plans`
- **마이그레이션 파일:** `supabase/migrations/20260724074000_create_date_plans_table.sql`
- **스키마 구조:**
  ```sql
  CREATE TABLE IF NOT EXISTS public.date_plans (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
      created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL DEFAULT '미래 데이트 플랜',
      plan_date DATE NOT NULL,
      spots JSONB NOT NULL DEFAULT '[]'::jsonb,
      route_summary JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );
  ```
- **RLS 정책:** SELECT/INSERT/UPDATE/DELETE 정책 활성화 및 `anon`, `authenticated`, `service_role` 권한 부여.

## 3. 핵심 주요 기능 및 워크플로우
1. **날짜 선택 UI (`FuturePlanSheet.tsx`):**
   - HTML5 `<input type="date">` 날짜 선택 컨트롤 연동 (`selectedDate`, 기본값: 오늘 날짜 `YYYY-MM-DD`).
2. **Supabase DB 영구 저장 (`useFuturePlanner.ts`):**
   - "DB에 저장" 버튼 클릭 시 선택된 날짜와 핀 장소 배열(`spots`)을 `date_plans` 테이블에 `upsert/insert`.
   - 저장 완료 시 토스트 알림 표시 및 해당 날짜 저장 목록 자동 동기화.
3. **저장된 DB 플랜 원터치 불러오기 & 삭제:**
   - 선택된 날짜에 저장된 DB 플랜이 존재할 경우 하단 칩 형태 목록으로 노출.
   - 칩 터치 시 해당 플랜의 핀 코스를 지도와 플래너 드로어에 원터치 복원.

## 4. 관련 파일
- `supabase/migrations/20260724074000_create_date_plans_table.sql`
- `supabase/schema.sql`
- `src/types/supabase.ts`
- `src/types/planner.ts`
- `src/hooks/useFuturePlanner.ts`
- `src/components/modal/FuturePlanSheet.tsx`
- `src/app/page.tsx`
