# [Task 15] 순수 지도 기본 화면 & 과거/미래 데이트 일정 목록 파이프라인 (!DB)

## 1. 개요 (Overview)
- **작성일:** 2026-07-24
- **버전:** `v0.8.0`
- **목적:** 앱 진입 시 순수 풀스크린 지도를 기본 화면으로 노출하고, 과거 및 미래의 모든 데이트 일정 목록(`DateItineraryModal`)을 날짜 범위 기준(`start_date` ~ `end_date`)으로 정리하여 조회, 원터치 복원, 생성이 가능하도록 구축합니다.

## 2. 데이터베이스 마이그레이션 (`!DB`)
- **마이그레이션 파일:** `supabase/migrations/20260724074500_add_date_range_to_date_plans.sql`
- **변경 사항:**
  `public.date_plans` 테이블에 `start_date DATE` 및 `end_date DATE` 컬럼 추가 및 기존 레코드 백필 처리.

## 3. 핵심 주요 기능 및 워크플로우
1. **순수 지도 기본 화면 (Pure Map Default View):**
   - 초기 화면 진입 시 하단 시트가 닫힌 상태(`isExpanded = false`)로 풀스크린 순수 지도가 노출됩니다.
2. **과거 & 미래 데이트 일정 목록 모달 (`DateItineraryModal.tsx`):**
   - 헤더 메뉴 및 플래너의 `일정 목록` 버튼 클릭 시 DB에 저장된 전체 데이트 일정을 날짜별로 정렬하여 표시.
   - 🔮 **미래 데이트** (`start_date >= today`) 및 ⏳ **과거 데이트** (`end_date < today`) 탭 분리 제공.
   - 카드 터치 시 해당 날짜 코스를 지도 및 플래너 드로어에 원터치 불러오기 (`onLoadPlan`).
3. **기간 지정 데이트 추가 모달 (`CreateDatePlanModal.tsx`):**
   - 시작일~종료일 범위 선택(당일치기, 1박 2일, 2박 3일 퀵 칩) 및 제목 설정 후 지도 상 핀 찍기 모드 진입.
   - 핀 찍기 완료 후 "DB에 저장" 시 날짜 범위 기반으로 일정 목록에 자동 등록.

## 4. 관련 파일
- `supabase/migrations/20260724074500_add_date_range_to_date_plans.sql`
- `supabase/schema.sql`
- `src/types/supabase.ts`
- `src/types/planner.ts`
- `src/hooks/useFuturePlanner.ts`
- `src/components/modal/DateItineraryModal.tsx`
- `src/components/modal/CreateDatePlanModal.tsx`
- `src/components/modal/FuturePlanSheet.tsx`
- `src/components/common/Header.tsx`
- `src/app/page.tsx`
