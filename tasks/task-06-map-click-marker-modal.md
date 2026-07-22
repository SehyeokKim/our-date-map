# task-06-map-click-marker-modal

🎯 **목표 (Goal)**
- 지도 화면의 임의의 위치를 클릭하여 해당 좌표에 임시 핀(마커)을 배치하고, 해당 핀을 터치하면 상세 정보(장소 이름, 방문 일자, 메모, 사진 등)를 입력받아 저장할 수 있는 입력 모달/바텀 시트를 구현합니다.
- 단일 거대 파일(`src/app/page.tsx`)을 `.antigravityrules`에 명시된 프로젝트 모듈화 표준에 맞게 컴포넌트(`src/components/`), 데이터 타입(`src/types/`), 커스텀 훅(`src/hooks/`) 단위로 관심사를 분리하여 클린 아키텍처로 리팩토링합니다.

✅ **진행 상태 (Status)**
- `Planned` (예정 / 예상 적용 버전: `v0.2.0`)

---

📐 **구현 세부 스펙 (Specifications)**

### 1. 데이터 타입 정의 (`src/types/spot.ts`)
- Supabase `date_spots` 테이블 스키마에 대응하는 TypeScript 인터페이스 정의.
- **주요 타입:**
  - `DateSpot`: `id`, `title`, `description`, `latitude`, `longitude`, `image_url`, `visited_at`, `created_at`
  - `CreateDateSpotInput`: `Omit<DateSpot, 'id' | 'created_at'>`

### 2. Custom Hooks 개발 (`src/hooks/`)
- **`useKakaoMap.ts`**:
  - Kakao Maps SDK 비동기 초기화 및 지도 객체 상태 관리.
  - 실시간 GPS 추적 및 사용자 위치 오버레이 동기화.
  - 지도 클릭 시 임시 마커 배치 및 위치 이동 이벤트 핸들링.
  - 등록된 데이트 장소 목록 오버레이 마커 렌더링.
- **`useDateSpots.ts`**:
  - Supabase Database 조회/생성 로직.
  - `uploadCompressedPhoto` 기반 클라이언트 사이드 이미지 압축 업로드 헬퍼 연동.

### 3. 컴포넌트 모듈화 구조 (`src/components/`)
- **`src/components/map/MapContainer.tsx`**:
  - 카카오 지도 DOM 영역 렌더링 및 `useKakaoMap` 훅 조작 컨테이너.
- **`src/components/modal/AddSpotModal.tsx`**:
  - 임시 마커를 클릭하여 띄우는 데이트 기록 등록 모달 (사진 파일 첨부, 프리뷰, 장소/제목, 방문 날짜, 메모 폼).
- **`src/components/modal/SpotDetailSheet.tsx`**:
  - 지도 상의 기존 데이트 마커를 터치할 때 나타나는 상세 보기 바텀 시트.
- **`src/components/common/Header.tsx`**:
  - 상단 브랜딩 Glassmorphic Header UI.
- **`src/components/common/Toast.tsx`**:
  - 성공/에러 피드백을 알리는 알림 토스트 UI.

### 4. 메인 엔트리 리팩토링 (`src/app/page.tsx`)
- 거대한 비즈니스 로직 및 JSX 구조를 제거하고, 분리된 Hooks 및 Components를 조립하는 메인 엔트리로 리팩토링.

---

🎨 **UI/UX & Mobile First 가이드라인**
- **모바일 퍼스트 레이아웃:** `w-screen h-screen overflow-hidden` 규격 유지.
- **프리미엄 Glassmorphism:** Tailwind CSS `backdrop-blur-md` 및 은은한 그림자 스타일 적용.
- **애니메이션:** 모달/바텀 시트 진입 시 부드러운 슬라이드 업 트랜지션 적용.
- **터치 영역:** 최소 44x44px 터치 영역 확보 및 `active:scale-95` 터치 피드백.

---

🛠️ **관련 코드 및 파일 경로 (Implemented & Related Files)**
- `[NEW] src/types/spot.ts`: 데이트 장소 데이터 타입 정의
- `[NEW] src/hooks/useKakaoMap.ts`: Kakao Map 지도 조작 및 이벤트 관리 훅
- `[NEW] src/hooks/useDateSpots.ts`: Supabase 연동 및 이미지 압축 데이터 훅
- `[NEW] src/components/map/MapContainer.tsx`: 지도 뷰 및 컨트롤러 컴포넌트
- `[NEW] src/components/modal/AddSpotModal.tsx`: 데이트 장소 등록 모달 컴포넌트
- `[NEW] src/components/modal/SpotDetailSheet.tsx`: 데이트 장소 상세 정보 바텀 시트
- `[NEW] src/components/common/Header.tsx`: 상단 헤더 컴포넌트
- `[NEW] src/components/common/Toast.tsx`: 알림 토스트 컴포넌트
- `[MODIFY] src/app/page.tsx`: 모듈화된 컴포넌트 조립을 위한 메인 페이지 리팩토링
- `[MODIFY] CHANGELOG.md`: 구현 완료 후 변경 이력 반영

---

⚠️ **유지 관리 시 주의사항 & 체크리스트 (Caveats & Checklist)**
- [ ] **TypeScript First:** `any` 타입 지양 및 Kakao Maps API에 대해 명확한 인터페이스 정의/확장.
- [ ] **이미지 압축:** `browser-image-compression`으로 업로드 전 300KB 이하 검증.
- [ ] **Kakao Map SDK 로드 안전성:** SDK 로드가 완료된 후에만 지도 및 이벤트 등록 실행.
- [ ] **GPS 예외 처리:** 위치 권한 거부 시 기본 위치(남산타워) 로딩 및 안내 토스트 노출.
- [ ] **CHANGELOG.md 기재:** 기능 완료 후 `CHANGELOG.md` 내에 한국어로 업데이트 작성.
