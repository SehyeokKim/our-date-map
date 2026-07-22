# 변경 이력

이 프로젝트의 모든 주목할 만한 변경 사항이 이 파일에 기록됩니다.

이 포맷은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)를 기반으로 하며,
이 프로젝트는 [유의적 버전](https://semver.org/spec/v2.0.0.html) 규격을 준수합니다.

## [Unreleased]

### 추가
- 저장된 데이트 기록 상세 보기 바텀 시트([SpotDetailSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotDetailSheet.tsx)) 하단에 🗑️ **핀 삭제** 버튼을 추가했습니다. 사용자가 삭제를 승인할 경우 Supabase DB 레코드 및 Storage 버킷의 원본 이미지가 함께 완전 제거됩니다.
- 디버깅용 **"Test"** 제목(대소문자 미구분)으로 생성된 데이트 기록에 대해 생성 3분(180초) 후 Supabase DB 및 Storage에서 자동으로 완전 삭제되는 타이머 워커 기능([useDateSpots.ts](file:///c:/dev/our-date-map/src/hooks/useDateSpots.ts))을 추가했습니다.

### 변경
- 데이트 기록 등록 모달([AddSpotModal.tsx](file:///c:/dev/our-date-map/src/components/modal/AddSpotModal.tsx)) 내 중복되었던 '위치 주소' 입력 필드를 제거하고, 핀 이모지가 포함된 **📍 '장소'** 단일 필드로 통합하여 UI를 깔끔하게 다듬었습니다.

### 수정
- Supabase `date_spots` 테이블에 대한 `anon` 익명 역할의 INSERT/SELECT 테이블 접근 권한(`GRANT ALL ON public.date_spots TO anon`) 부족으로 인해 데이트 기록 등록 시 발생하던 데이터베이스 오류(`permission denied for table date_spots`)를 마이그레이션(`20260722003349_fix_date_spots_permissions.sql`) 적용을 통해 해결했습니다.
- `useDateSpots` 커스텀 훅에서 Supabase `PostgrestError` 발생 시 범용 에러 문구로 가려지던 현상을 개선하여 실제 에러 메시지가 사용자 토스트 알림에 노출되도록 예외 처리를 보완했습니다.

## [0.2.0] - 2026-07-22

### 추가
- 지도의 임의 위치 클릭 시 해당 좌표에 바운스 임시 오버레이 핀 마커 생성 및 핀 터치 시 데이트 장소 기록(사진, 제목, 날짜, 메모)을 입력하는 바텀 시트 폼 UI([AddSpotModal.tsx](file:///c:/dev/our-date-map/src/components/modal/AddSpotModal.tsx))를 구현했습니다.
- 프로젝트 전체 작업 현황 및 Task 세부 명세를 총괄하는 [TASKS.md](file:///c:/dev/our-date-map/TASKS.md) master 오버뷰 문서를 루트 경로에 추가했습니다.

### 변경
- 기존 거대한 단일 파일 구조였던 메인 페이지([page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx))를 프로젝트 모듈화 표준 가이드라인에 맞춰 타입([types/](file:///c:/dev/our-date-map/src/types/)), 커스텀 훅([hooks/](file:///c:/dev/our-date-map/src/hooks/)), 컴포넌트([components/](file:///c:/dev/our-date-map/src/components/)) 단위로 가독성 높게 리팩토링했습니다.

- `navigator.geolocation.watchPosition`을 이용한 실시간 GPS 위치 추적 기능을 추가하여 사용자의 움직임에 따라 지도의 위치가 실시간으로 자동 업데이트되도록 구현했습니다.
- Kakao 지도 API 로드 실패 시(예: 미등록 도메인으로 호출 시) 해결 방법을 직관적으로 안내하는 글래스모피즘 스타일의 오류 안내 카드 UI를 추가했습니다.
- 데이터베이스 테이블 및 스토리지 버킷 스키마 관리를 위해 [schema.sql](file:///c:/dev/our-date-map/supabase/schema.sql) 스키마 정의 파일을 프로젝트 루트 경로에 추가했습니다.
- 데이트 장소를 기록할 수 있는 바텀 시트 폼(사진 첨부, 장소/제목, 날짜, 메모) 및 저장된 장소를 확인할 수 있는 상세 정보 뷰 바텀 시트 UI를 구현했습니다.
- Supabase Database(`date_spots`) 연동을 통한 데이트 장소 목록 불러오기 및 신규 등록 기능을 구현하고, 업로드된 사진을 버킷에 저장하여 맵 마커와 연동했습니다.
- 데이트 장소 추가 모드 시 지도를 터치하여 원하는 위치로 마커 핀을 미세 조정할 수 있는 위치 이동 선택 인터페이스를 구현했습니다.


### 변경
- Kakao 지도 `<Script>` 태그를 서버 컴포넌트인 레이아웃 ([layout.tsx](file:///c:/dev/our-date-map/src/app/layout.tsx))에서 클라이언트 컴포넌트인 메인 페이지 ([page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx))로 이동시켰습니다. `next/script`가 제공하는 `onLoad` 및 `onError` 이벤트 핸들러를 사용해 기존의 불안정했던 `setInterval` 폴링 로직을 제거했습니다.
- 지도 위에 표시되는 실시간 pulsing GPS 마커의 애니메이션 및 스타일을 동적 Tailwind 클래스 대신 [globals.css](file:///c:/dev/our-date-map/src/app/globals.css)에 명시적인 CSS 클래스 (`.custom-user-marker`)로 분리하여 정의했습니다. 이로 인해 빌드 타임에 Tailwind 컴파일러가 스타일을 누락 (Purge)시키는 현상을 원천 방지했습니다.

### 보안
- 로컬 환경 설정 변수 및 키 정보가 실수로 노출되지 않도록 [.gitignore](file:///c:/dev/our-date-map/.gitignore)에 Next.js 표준 로컬 환경 파일 목록 (`.env.local`, `.env.development.local`, `.env.production.local` 등)을 명확하게 추가하여 보안을 강화했습니다.

---

## [0.1.0] - 2026-07-21

### 추가
- Next.js (App Router, TypeScript) 프로젝트의 초기 구성을 시작했습니다.
- Kakao 지도 JavaScript SDK를 연동하여 지도 컨테이너 렌더링 및 초기 위치 포커싱 기능을 통합했습니다.
- Supabase 클라이언트 ([supabase.ts](file:///c:/dev/our-date-map/src/lib/supabase.ts)) 및 `browser-image-compression` 기반의 클라이언트 사이드 이미지 압축 업로드 헬퍼 ([upload.ts](file:///c:/dev/our-date-map/src/lib/upload.ts))를 추가했습니다.
- PWA 단독 (standalone) 실행 환경 최적화를 위한 웹 앱 매니페스트 (`manifest.json`)와 Apple 메타 설정을 적용했습니다.

### 변경
- 메인 홈 페이지 ([page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx)) 구조를 전체 화면 메인 지도 중심의 데이트 기록 인터페이스로 변경했습니다.
