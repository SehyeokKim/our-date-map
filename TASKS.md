# 우리들의 데이트 지도 (Our Date Map) - 작업 구현 현황 (`TASKS.md`)

이 문서는 **우리들의 데이트 지도** 프로젝트에서 구현 완료된 작업(Completed Tasks) 및 구현 예정 작업(Planned Tasks)의 전체 개요와 세부 명세 링크를 관리하는 프로젝트 루트 총괄 문서입니다.

---

## 📌 전체 진행 상황 요약 (Overall Status)

- **현재 버전:** `v0.4.0`
- **구현 완료 (Completed):** Task 01 ~ Task 12 (기본 PWA, Kakao Map SDK, 실시간 GPS, Supabase 연동, 마커 & 상세 보기, 다중 사진 업로드, 미래 데이트 플래닝, Kakao OAuth, Web Push 알림, profiles 테이블 분리, 프로필 수정 모달, 삭제 핀 휴지통 테이블 & 소프트 삭제 파이프라인)
- **진행 예정 (Planned):** 추후 추가 예정 피처

---

## 🛠️ 지금까지 구현된 작업 목록 (Implemented Tasks)

### 1. [Task 01] PWA 단독 실행 최적화 & 모바일 레이아웃
- **상태:** `Completed` (완료일: 2026-07-21 / 적용 버전: `v0.1.0`)
- **개요:** 모바일 브라우저 및 iOS/Android PWA 단독(standalone) 실행 환경에 최적화된 풀스크린 레이아웃을 구축했습니다.
- **주요 스펙:**
  - `userScalable: false` 설정을 통한 모바일 핀치 줌 방지
  - `public/manifest.json` 내 `display: standalone` 설정으로 모바일 앱과 동일한 UX 제공
  - Tailwind CSS `backdrop-blur-md` 기반 Glassmorphic 헤더 바 구현
- **상세 명세:** [`tasks/task-01-pwa-mobile-layout.md`](file:///c:/dev/our-date-map/tasks/task-01-pwa-mobile-layout.md)
- **주요 파일:** [layout.tsx](file:///c:/dev/our-date-map/src/app/page.tsx), [manifest.json](file:///c:/dev/our-date-map/public/manifest.json), [globals.css](file:///c:/dev/our-date-map/src/app/globals.css)

---

### 2. [Task 02] Kakao Map SDK 비동기 연동 & 예외 처리
- **상태:** `Completed` (완료일: 2026-07-21 / 적용 버전: `v0.1.1`)
- **개요:** Kakao Maps JavaScript SDK를 Next.js App Router 환경에서 비동기로 안전하게 로드하고, API 키 문제나 미등록 도메인 접근 시 오류 안내 UI를 제공합니다.
- **주요 스펙:**
  - `next/script` (`strategy="afterInteractive"`) 및 `window.kakao.maps.load()` 안전 래핑
  - 초기 지도 좌표를 남산서울타워(`37.551172, 126.988226`)로 설정
  - API 로드 실패 시 카카오 개발자 콘솔 플랫폼 설정 안내를 담은 글래스모피즘 에러 카드 UI 반환
- **상세 명세:** [`tasks/task-02-kakao-map-integration.md`](file:///c:/dev/our-date-map/tasks/task-02-kakao-map-integration.md)
- **주요 파일:** [page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx), `.env.local`

---

### 3. [Task 03] 실시간 GPS 위치 추적 & Pulsing 마커
- **상태:** `Completed` (완료일: 2026-07-21 / 적용 버전: `v0.1.1`)
- **개요:** HTML5 Geolocation API를 사용하여 사용자의 실시간 GPS 위치를 추적하고, 지도 위에 파동(ping) 애니메이션 마커로 표시합니다.
- **주요 스펙:**
  - `navigator.geolocation.watchPosition` (`enableHighAccuracy: true`) 기반 실시간 추적
  - Kakao Maps `CustomOverlay`를 활용한 펄싱(ping) 파동 커스텀 위치 마커 시각화
  - 최초 1회 사용자 위치로 자동 포커싱 및 우하단 GPS FAB(Floating Action Button)을 통한 재포커싱 기능
- **상세 명세:** [`tasks/task-03-realtime-gps-tracking.md`](file:///c:/dev/our-date-map/tasks/task-03-realtime-gps-tracking.md)
- **주요 파일:** [page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx), [globals.css](file:///c:/dev/our-date-map/src/app/globals.css)

---

### 4. [Task 04] Supabase DB & 스토리지 업로드 파이프라인
- **상태:** `Completed` (완료일: 2026-07-21 / 적용 버전: `v0.1.0`)
- **개요:** Supabase PostgreSQL 데이터베이스(`date_spots` 테이블)와 Storage 버킷(`date-photos`)을 연동하고, 클라이언트 사이드 이미지 압축 파이프라인을 구축했습니다.
- **주요 스펙:**
  - `date_spots` 테이블 schema DDL 및 RLS (Row Level Security) 정책 정의
  - `browser-image-compression` 활용: 업로드 전 사진을 300KB 이하, 최대 해상도 1200px로 클라이언트 압축
  - Supabase Storage `date-photos` 버킷 저장 및 퍼블릭 접근 URL (`getPublicUrl`) 반환
- **상세 명세:** [`tasks/task-04-supabase-storage-pipeline.md`](file:///c:/dev/our-date-map/tasks/task-04-supabase-pipeline.md)
- **주요 파일:** [supabase.ts](file:///c:/dev/our-date-map/src/lib/supabase.ts), [upload.ts](file:///c:/dev/our-date-map/src/lib/upload.ts), [schema.sql](file:///c:/dev/our-date-map/supabase/schema.sql)

---

### 5. [Task 05] 데이트 장소 마커 표시 & 상세 보기 시트
- **상태:** `Completed` (완료일: 2026-07-21 / 적용 버전: `v0.1.1`)
- **개요:** Supabase DB에 저장된 데이트 장소 데이터를 패칭하여 지도 위에 분홍색 하트 커스텀 마커로 렌더링하고, 터치 시 상세 정보를 확인할 수 있는 바텀 시트를 노출합니다.
- **주요 스펙:**
  - Kakao Maps `CustomOverlay`를 활용한 분홍색 하트 마커 렌더링
  - 마커 터치 시 지도 이동(`map.panTo`) 및 이벤트 버블링 차단 (`e.stopPropagation()`)
  - 바텀 시트를 통한 추억 사진, 한국어 포맷 날짜, 장소명, 데이트 이야기 및 좌표 표시
- **상세 명세:** [`tasks/task-05-spot-marker-detail-sheet.md`](file:///c:/dev/our-date-map/tasks/task-05-spot-marker-detail-sheet.md)
- **주요 파일:** [page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx), [schema.sql](file:///c:/dev/our-date-map/supabase/schema.sql)

---

### 6. [Task 06] 다중 사진 업로드(최대 10장) & 2단계 요약/자세히보기 팝업 구축
- **상태:** `Completed` (완료일: 2026-07-22 / 적용 버전: `v0.2.0`)
- **개요:** 데이트 기록 시 사진 최대 10장 업로드 지원(`image_urls TEXT[]`), 1단계 요약 팝업(대표사진 1장, 1줄 메모, 제목링크) ➔ 2단계 전체 자세히보기 팝업(사진 10장 캐러셀 갤러리, 메모 전문, 🗑️ 핀 삭제 버튼) 재구축.
- **주요 스펙:**
  - 최대 10장 다중 사진 선택, 개별 압축 업로드 및 `image_urls TEXT[]` 스키마 마이그레이션 (`20260722022000_add_image_urls_array_to_date_spots.sql`)
  - 1단계 요약 팝업([SpotSummarySheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotSummarySheet.tsx)): 대표사진 1장, 1줄 메모, 제목 링크, 핀 삭제 버튼 제거
  - 2단계 전체 자세히보기 팝업([SpotDetailSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotDetailSheet.tsx)): 10장 갤러리 슬라이더 캐러셀, 메모 전문, 📍 위경도, 🗑️ 핀 삭제 버튼
- **상세 명세:** [`tasks/task-06-map-click-marker-modal.md`](file:///c:/dev/our-date-map/tasks/task-06-map-click-marker-modal.md)
- **주요 파일:** [page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx), [AddSpotModal.tsx](file:///c:/dev/our-date-map/src/components/modal/AddSpotModal.tsx), [SpotSummarySheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotSummarySheet.tsx), [SpotDetailSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotDetailSheet.tsx)

---

### 7. [Task 07] 미래 데이트 플래닝 & Kakao Mobility API 코스 시각화
- **상태:** `Completed` (완료일: 2026-07-23 / 적용 버전: `v0.3.0`)
- **개요:** 헤더 드롭다운 메뉴를 통해 '추억 데이트 지도'와 '미래 데이트 플래닝' 모드를 자유롭게 전환하고, 미래 방문할 데이트 장소를 순서대로 핀 찍어 Kakao Mobility API (`/api/directions`) 기반 경로 코스(Polyline) 및 거리/시간을 시각화하는 기능을 구현했습니다.
- **주요 스펙:**
  - Glassmorphic 인터랙티브 드롭다운 메뉴 헤더 ([Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx))
  - 미래 플래닝 코스 핀 추가 ([AddPlannedSpotModal.tsx](file:///c:/dev/our-date-map/src/components/modal/AddPlannedSpotModal.tsx)) 및 순서 변경/삭제/초기화 제어 바텀 시트 ([FuturePlanSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/FuturePlanSheet.tsx))
  - Kakao Mobility 다중 경유지 Route Handler (`/api/directions/route.ts`) 연동, `Polyline` 경로선 시각화 및 `localStorage` 자동 보존
- **상세 명세:** [`tasks/task-07-future-date-planning.md`](file:///c:/dev/our-date-map/tasks/task-07-future-date-planning.md)
- **주요 파일:** [route.ts](file:///c:/dev/our-date-map/src/app/api/directions/route.ts), [Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx), [useFuturePlanner.ts](file:///c:/dev/our-date-map/src/hooks/useFuturePlanner.ts), [useDirections.ts](file:///c:/dev/our-date-map/src/hooks/useDirections.ts), [FuturePlanSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/FuturePlanSheet.tsx)

---

### 8. [Task 08] Kakao OAuth 인증 연동 & 데이트 장소 작성자 추적
- **상태:** `Completed` (완료일: 2026-07-23 / 적용 버전: `v0.4.0`)
- **개요:** Kakao OAuth 간편 로그인 연동(`@supabase/ssr`)을 구축하고, 데이트 핀 추가 시 작성자의 ID 및 닉네임/프로필 사진을 자동으로 저장하며 상세 보기에서 작성자 정보를 시각화합니다.
- **주요 스펙:**
  - DB 컬럼 마이그레이션 (`user_id`, `created_by`, `creator_nickname`, `creator_avatar_url`) 및 RLS 소유권 정책 적용 (`20260723103136_add_user_id_to_spots_and_records.sql`)
  - Supabase Browser & Server Client (`src/lib/supabase/client.ts`, `server.ts`) 및 Auth Callback Route Handler (`/auth/callback/route.ts`) 구현
  - 핀 기록 시 인증 세션의 `user_id` 자동 첨부 및 상세 시트 `(내 기록)` 작성자 배지 시각화
  - Kakao OAuth `redirectTo` (`${origin}/auth/callback`) 동적 설정 및 KOE205 방지를 위한 `scopes` / `queryParams.scope` 명시적 재정의 (`profile_nickname profile_image`)
  - Auth Callback Route Handler 세션 교환 추적 및 서버/클라이언트 예외 로깅 추가
  - 헤더 드롭다운 내 카카오 간편 로그인 / 프로필 & 로그아웃 UI 통합 및 상세 시트 작성자 배지 노출
- **상세 명세:** [`tasks/task-08-kakao-auth-creator-tracking.md`](file:///c:/dev/our-date-map/tasks/task-08-kakao-auth-creator-tracking.md)
- **주요 파일:** [client.ts](file:///c:/dev/our-date-map/src/lib/supabase/client.ts), [server.ts](file:///c:/dev/our-date-map/src/lib/supabase/server.ts), [useAuth.ts](file:///c:/dev/our-date-map/src/hooks/useAuth.ts), [Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx), [SpotDetailSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotDetailSheet.tsx)

---

### 9. [Task 09] Web Push 알림 토글 UI & 실시간 전송 파이프라인
- **상태:** `Completed` (완료일: 2026-07-24 / 적용 버전: `v0.5.0`)
- **개요:** 헤더 프로필 카드 내 Popcat 이미지 버튼(`popcat_close.png` / `popcat_open.png`)을 통한 웹 푸시 알림 ON/OFF 토글, 커스텀 알림 문구 설정 모달([CustomPushMessageModal.tsx](file:///c:/dev/our-date-map/src/components/modal/CustomPushMessageModal.tsx)), 및 지도 우측 하단 Popcat 알림 전송 버튼(1초 오픈 애니메이션 & 쿨다운)을 구현하고, Web Push API 및 서비스 워커를 연동하여 실시간 알림을 발송합니다.
- **주요 스펙:**
  - 프로필 카드 하단 팝캣 위치 ([Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx)): `[로그아웃]` 좌측 보더리스 transparent 버튼, Popcat 커스텀 이미지 (`popcat_close.png` / `popcat_open.png`), 권한 요청 및 구독 상태 `localStorage` & Supabase DB 동기화
  - 커스텀 메시지 설정 모달 ([CustomPushMessageModal.tsx](file:///c:/dev/our-date-map/src/components/modal/CustomPushMessageModal.tsx)): Popcat 버튼 우상단 연필 아이콘 클릭 시 오픈, 제목/본문 입력, 퀵 프리셋 칩("지금 뭐해? 🤔", "보고 싶어 💖" 등), `localStorage` (`our_date_map_custom_push_message`) 저장
  - 지도 플로팅 팝캣 전송 위치 ([MapContainer.tsx](file:///c:/dev/our-date-map/src/components/map/MapContainer.tsx)): 푸시 ON 시 우측 하단 노출, 클릭 시 사용자 커스텀 페이로드로 즉시 상대방 알림 전송 및 1초간 입 벌리는 애니메이션(`popcat_open.png`), 1초간 연타 방지 쿨다운(`isCooldown`) 적용
  - Web Push 서비스 워커 ([sw.js](file:///c:/dev/our-date-map/public/sw.js)) 백그라운드 푸시 및 클릭 포커싱 처리
  - `push_subscriptions` DB 마이그레이션 및 Next.js Route Handler (`/api/push/send/route.ts`)
- **주요 파일:** [sw.js](file:///c:/dev/our-date-map/public/sw.js), [useWebPush.ts](file:///c:/dev/our-date-map/src/hooks/useWebPush.ts), [route.ts](file:///c:/dev/our-date-map/src/app/api/push/send/route.ts), [Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx), [MapContainer.tsx](file:///c:/dev/our-date-map/src/components/map/MapContainer.tsx), [CustomPushMessageModal.tsx](file:///c:/dev/our-date-map/src/components/modal/CustomPushMessageModal.tsx)

---

### 10. [Task 10] 작성자 메타데이터 profiles 테이블 분리 및 동적 관계형 조인
- **상태:** `Completed` (완료일: 2026-07-24 / 적용 버전: `v0.4.0`)
- **개요:** `date_spots` 테이블 내 하드코딩된 작성자 메타데이터 컬럼들(`creator_nickname`, `creator_avatar_url`)을 전면 제거하고, `auth.users(id)`와 1:1 대응되는 `public.profiles` 테이블을 신설하여 `created_by` (UUID) 외래키(FK) 기반 dynamic relational JOIN 구문으로 리팩토링했습니다.
- **주요 스펙:**
  - `public.profiles` 테이블 신설 및 RLS 정책(전체 조회 허용, 자가 수정 제한) 적용 (`20260723233625_decouple_creator_data_to_profiles.sql`)
  - 회원가입 시 프로필 자동 생성 DB 트리거 (`on_auth_user_created`) 및 기존 유저 백필 로직 구현
  - `date_spots` 테이블에서 작성자 텍스트 컬럼 삭제 및 `created_by REFERENCES public.profiles(id)` FK 정의
  - Supabase 조회 쿼리 동적 JOIN 연동 (`.select('*, profiles(id, nickname, profile_image_url)')`)
  - UI 컴포넌트 동적 프로필 접근 연동 (`spot.profiles.nickname`, `spot.profiles.profile_image_url`)
- **주요 파일:** [20260723233625_decouple_creator_data_to_profiles.sql](file:///c:/dev/our-date-map/supabase/migrations/20260723233625_decouple_creator_data_to_profiles.sql), [schema.sql](file:///c:/dev/our-date-map/supabase/schema.sql), [supabase.ts](file:///c:/dev/our-date-map/src/types/supabase.ts), [spot.ts](file:///c:/dev/our-date-map/src/types/spot.ts), [useDateSpots.ts](file:///c:/dev/our-date-map/src/hooks/useDateSpots.ts), [SpotDetailSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotDetailSheet.tsx)

---

### 11. [Task 11] 프로필 수정 모달 UI 구축 & DB/스토리지 동기화
- **상태:** `Completed` (완료일: 2026-07-24 / 적용 버전: `v0.4.0`)
- **개요:** 헤더 드롭다운의 사용자 카드를 클릭하여 닉네임과 프로필 사진을 직접 변경할 수 있는 프로필 수정 모달 UI([ProfileEditModal.tsx](file:///c:/dev/our-date-map/src/components/modal/ProfileEditModal.tsx))를 구현하고, Supabase Storage `avatars` 버킷 및 `public.profiles` DB 동기화 파이프라인을 구축했습니다.
- **주요 스펙:**
  - 헤더 드롭다운 하단 유저 프로필 카드 클릭 트리거 및 호버 인터랙션 ([Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx))
  - `ProfileEditModal` UI: 프로필 사진 300KB 압축 및 실시간 미리보기, 닉네임 입력, `취소`/`저장` 버튼 ([ProfileEditModal.tsx](file:///c:/dev/our-date-map/src/components/modal/ProfileEditModal.tsx))
  - Supabase Storage `avatars` 퍼블릭 버킷 마이그레이션 (`20260723235156_add_avatars_storage_bucket.sql`)
  - `useAuth` 훅 강화: `profiles` 조회/upsert, Kakao OAuth 기본값 자동 폴백, 실시간 전역 프로필 동기화 ([useAuth.ts](file:///c:/dev/our-date-map/src/hooks/useAuth.ts))
- **주요 파일:** [ProfileEditModal.tsx](file:///c:/dev/our-date-map/src/components/modal/ProfileEditModal.tsx), [useAuth.ts](file:///c:/dev/our-date-map/src/hooks/useAuth.ts), [upload.ts](file:///c:/dev/our-date-map/src/lib/upload.ts), [Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx), [page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx), [schema.sql](file:///c:/dev/our-date-map/supabase/schema.sql)

---

### 12. [Task 12] 삭제된 데이트 핀 휴지통 테이블 (deleted_date_spots) & 소프트 삭제 메커니즘
- **상태:** `Completed` (완료일: 2026-07-24 / 적용 버전: `v0.4.0`)
- **개요:** 핀 삭제 시 원본 데이터의 하드 삭제를 방지하고 휴지통에 보존 및 복원할 수 있도록 `deleted_date_spots` 전용 테이블 및 RLS 정책을 구축하고, 소프트 삭제 워크플로우를 완성했습니다.
- **주요 스펙:**
  - `deleted_date_spots` 휴지통 테이블 신설 마이그레이션 (`20260724000135_create_deleted_date_spots_table.sql`)
  - 컬럼: `id`, `original_spot_id`, `spot_data` (JSONB), `deleted_by`, `deleted_at`, `reason`
  - 핀 삭제 시 스팟 전체 데이터를 `deleted_date_spots`에 아카이빙하고 `date_spots` 내 `deleted_at = NOW()` 처리
  - 소프트 삭제된 핀 복원 메서드 (`restoreDateSpot`) 및 휴지통 목록 패칭 (`fetchDeletedSpots`) 구현
- **주요 파일:** [20260724000135_create_deleted_date_spots_table.sql](file:///c:/dev/our-date-map/supabase/migrations/20260724000135_create_deleted_date_spots_table.sql), [schema.sql](file:///c:/dev/our-date-map/supabase/schema.sql), [useDateSpots.ts](file:///c:/dev/our-date-map/src/hooks/useDateSpots.ts), [spot.ts](file:///c:/dev/our-date-map/src/types/spot.ts), [SpotDetailSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotDetailSheet.tsx)



