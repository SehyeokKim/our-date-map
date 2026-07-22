# task-06-map-click-marker-modal

🎯 **목표 (Goal)**
- 지도 화면의 임의의 위치를 클릭하여 해당 좌표에 임시 핀(마커)을 배치하고, Kakao Maps Reverse Geocoding(`kakao.maps.services.Geocoder`)을 통해 도로명/지번 주소를 실시간으로 자동 변환하여 입력 모달의 📍 **'장소'** 필드에 placeholder 가이드로 노출합니다.
- 저장된 핀 터치 시 **2단계 상세 보기 프로세스 (1단계: 요약 팝업의 클릭 가능한 장소명 제목 링크 → 2단계: 사진/이야기 전문 전체 상세 보기 팝업)**를 제공하며, 전체 상세 보기에서 **핀 삭제(Spot Deletion)** 기능 및 제목이 `"Test"`(대소문자 미구분)인 테스트 기록에 대한 **3분 후 자동 삭제 타이머** 기능을 제공합니다.
- 단일 거대 파일(`src/app/page.tsx`)을 `.antigravityrules`에 명시된 프로젝트 모듈화 표준에 맞게 컴포넌트(`src/components/`), 데이터 타입(`src/types/`), 커스텀 훅(`src/hooks/`) 단위로 관심사를 분리하여 클린 아키텍처로 리팩토링합니다.

✅ **진행 상태 (Status)**
- `Completed` (완료일: 2026-07-22 / 적용 버전: `v0.2.0`)

---

📐 **구현 세부 스펙 (Specifications)**

### 1. 데이터 타입 정의 (`src/types/spot.ts`, `src/types/kakao.d.ts`)
- Supabase `date_spots` 테이블 스키마 대응 TypeScript 인터페이스 정의.
- **주요 타입:**
  - `DateSpot`: `id`, `title`, `description`, `latitude`, `longitude`, `image_url`, `address`, `visited_at`, `created_at`
  - `CreateDateSpotInput`: `Omit<DateSpot, 'id' | 'created_at'>`
  - `window.kakao` 글로벌 타입 선언 (`kakao.d.ts`)

### 2. Custom Hooks 개발 (`src/hooks/`)
- **`useKakaoMap.ts`**:
  - Kakao Maps SDK 비동기 초기화 및 지도 객체 상태 관리.
  - 실시간 GPS 추적 및 사용자 위치 오버레이 동기화.
  - 지도 마커 클릭 시 1단계 요약 보기 팝업(`summarySpot`) 노출 및 2단계 전체 상세 보기(`selectedSpot`) 전환 지원.
- **`useDateSpots.ts`**:
  - Supabase DB 및 Storage 이미지 파일 삭제가 포함된 `deleteDateSpot` 기능 구현.
  - `"Test"` 제목 작성 시 3분(180초) 자동 삭제 타이머(`scheduleTestAutoDelete`) 구축.

### 3. 컴포넌트 모듈화 구조 (`src/components/`)
- **`src/components/map/MapContainer.tsx`**:
  - 카카오 지도 DOM 렌더링 및 `useKakaoMap` 훅 조작 컨테이너.
- **`src/components/modal/AddSpotModal.tsx`**:
  - 중복된 '위치 주소' 입력창을 제거하고 📍 **'장소'** 단일 필드로 통합.
  - 도로명 주소 placeholder 안내 및 미입력 제출 시 주소 자동 폴백 저장.
- **`src/components/modal/SpotSummarySheet.tsx`**:
  - 1단계 요약 정보 팝업 시트 (장소명 클릭 시 2단계 이동 링크, 날짜, 데이트 메모 요약 2줄 미리보기).
- **`src/components/modal/SpotDetailSheet.tsx`**:
  - 2단계 전체 상세 보기 팝업 (원본 비비율 자름 없는 이미지 뷰, 메모 전문, 주소, 📍 위경도, 🗑️ 핀 삭제 버튼).
- **`src/components/common/Header.tsx`**:
  - 상단 브랜딩 Glassmorphic Header UI.
- **`src/components/common/Toast.tsx`**:
  - 성공/에러/자동삭제 피드백 토스트 UI.

### 4. 메인 엔트리 리팩토링 (`src/app/page.tsx`)
- 거대한 비즈니스 로직 및 JSX 구조를 제거하고, 2단계 상세 보기 팝업 구조를 조립하는 메인 엔트리로 리팩토링.

---

🎨 **UI/UX & Mobile First 가이드라인**
- **모바일 퍼스트 레이아웃:** `w-screen h-screen overflow-hidden` 규격 유지.
- **프리미엄 Glassmorphism:** Tailwind CSS `backdrop-blur-md` 및 은은한 그림자 스타일 적용.
- **애니메이션:** 모달/바텀 시트 진입 시 부드러운 슬라이드 업 트랜지션 적용.
- **터치 영역:** 최소 44x44px 터치 영역 확보 및 `active:scale-95` 터치 피드백.

---

🛠️ **관련 코드 및 파일 경로 (Implemented & Related Files)**
- `[NEW] supabase/migrations/20260722004500_add_address_to_date_spots.sql`: DB address 컬럼 마이그레이션
- `[NEW] src/types/spot.ts`: 데이트 장소 데이터 타입 정의
- `[NEW] src/types/kakao.d.ts`: Kakao Maps 글로벌 인터페이스 선언
- `[NEW] src/hooks/useKakaoMap.ts`: Kakao Map 지도 조작 및 2단계 팝업 상태 훅
- `[NEW] src/hooks/useDateSpots.ts`: Supabase CRUD, 핀 삭제 및 Test 3분 자동 삭제 타이머 훅
- `[NEW] src/components/map/MapContainer.tsx`: 지도 뷰 및 컨트롤러 컴포넌트
- `[NEW] src/components/modal/AddSpotModal.tsx`: 데이트 장소 등록 모달 (📍 장소 필드 통합)
- `[NEW] src/components/modal/SpotSummarySheet.tsx`: 1단계 요약 정보 팝업 시트 (장소명 링크)
- `[NEW] src/components/modal/SpotDetailSheet.tsx`: 2단계 전체 상세 보기 시트 (원본 이미지/전문/핀 삭제 포함)
- `[NEW] src/components/common/Header.tsx`: 상단 헤더 컴포넌트
- `[NEW] src/components/common/Toast.tsx`: 알림 토스트 컴포넌트
- `[MODIFY] src/app/page.tsx`: 모듈화된 컴포넌트 조립을 위한 메인 페이지 리팩토링
- `[MODIFY] CHANGELOG.md`: 구현 완료 후 변경 이력 반영

---

⚠️ **유지 관리 시 주의사항 & 체크리스트 (Caveats & Checklist)**
- [x] **2단계 상세 보기 UX:** 핀 클릭 시 1단계 요약 시트 렌더링 → 클릭 가능한 장소명 제목 터치 시 2단계 전체 상세 시트 전환.
- [x] **TypeScript First:** `any` 타입 지양 및 Kakao Maps API에 대해 명확한 인터페이스 정의/확장.
- [x] **핀 삭제 파이프라인:** DB 레코드와 Storage 이미지가 함께 완전 삭제되도록 보장.
- [x] **Test 3분 자동 삭제:** 3분 만료 시 클라이언트 타이머 및 앱 진입 시 자동 정리 수행.
- [x] **CHANGELOG.md 기재:** 기능 완료 후 `CHANGELOG.md` 내에 한국어로 업데이트 작성.
