# 우리들의 데이트 지도 (Our Date Map) - 작업 구현 현황 (`TASKS.md`)

이 문서는 **우리들의 데이트 지도** 프로젝트에서 구현 완료된 작업(Completed Tasks) 및 구현 예정 작업(Planned Tasks)의 전체 개요와 세부 명세 링크를 관리하는 프로젝트 루트 총괄 문서입니다.

---

## 📌 전체 진행 상황 요약 (Overall Status)

- **현재 버전:** `v0.2.0`
- **구현 완료 (Completed):** Task 01 ~ Task 06 (기본 PWA, Kakao Map SDK, 실시간 GPS, Supabase 연동, 마커 & 상세 보기, 지도 클릭 마커 생성 모달, Reverse Geocoding 주소 자동 변환 & 모듈화 리팩토링)
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
- **주요 파일:** [layout.tsx](file:///c:/dev/our-date-map/src/app/layout.tsx), [manifest.json](file:///c:/dev/our-date-map/public/manifest.json), [globals.css](file:///c:/dev/our-date-map/src/app/globals.css)

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
- **상세 명세:** [`tasks/task-04-supabase-storage-pipeline.md`](file:///c:/dev/our-date-map/tasks/task-04-supabase-storage-pipeline.md)
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

### 6. [Task 06] 지도 클릭 기반 신규 데이트 장소 등록 & Reverse Geocoding 주소 자동 변환 & 모듈화 리팩토링
- **상태:** `Completed` (완료일: 2026-07-22 / 적용 버전: `v0.2.0`)
- **개요:** 지도의 임의 위치를 클릭하여 임시 핀을 찍고, Kakao Maps Reverse Geocoding(`kakao.maps.services.Geocoder`)을 통해 도로명/지번 주소를 실시간으로 자동 추출하여 신규 데이트 기록 폼(사진/제목/주소/날짜/메모) 모달에 채움 처리 및 저장하는 기능 구현.
- **주요 스펙:**
  - 지도 클릭 시 해당 좌표에 바운스 임시 오버레이 핀 렌더링 및 `coord2Address()` 주소 자동 변환
  - 데이트 정보 등록 바텀 시트/모달 UI (`AddSpotModal`)에 주소 자동입력 폼 필드 연동 및 DB `address` 컬럼 저장
  - 모듈화 아키텍처 분리: `src/components/`, `src/hooks/`, `src/types/`
- **상세 명세:** [`tasks/task-06-map-click-marker-modal.md`](file:///c:/dev/our-date-map/tasks/task-06-map-click-marker-modal.md)
- **주요 파일:** [page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx), [MapContainer.tsx](file:///c:/dev/our-date-map/src/components/map/MapContainer.tsx), [AddSpotModal.tsx](file:///c:/dev/our-date-map/src/components/modal/AddSpotModal.tsx), [useKakaoMap.ts](file:///c:/dev/our-date-map/src/hooks/useKakaoMap.ts), [useDateSpots.ts](file:///c:/dev/our-date-map/src/hooks/useDateSpots.ts)
