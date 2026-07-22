# task-06-map-click-marker-modal

🎯 **목표 (Goal)**
- 지도 화면의 임의의 위치를 클릭하여 해당 좌표에 임시 핀(마커)을 배치하고, Kakao Maps Reverse Geocoding(`kakao.maps.services.Geocoder`)을 통해 도로명/지번 주소를 실시간으로 자동 변환하여 입력 모달의 📍 **'장소'** 필드에 placeholder 가이드로 노출합니다.
- 데이터베이스 `date_spots` 레코드가 완전 삭제(Hard-Delete)되거나 3일 Soft-Delete 경과 및 10분 "Test" 자동삭제 시, Supabase Storage(`date-photos` 버킷) 내에 저장되어 있던 **원본 이미지 파일이 100% 동기화되어 완전 삭제**되는 파이프라인을 연동합니다.
- 단일 거대 파일(`src/app/page.tsx`)을 `.antigravityrules`에 명시된 프로젝트 모듈화 표준에 맞게 컴포넌트(`src/components/`), 데이터 타입(`src/types/`), 커스텀 훅(`src/hooks/`) 단위로 관심사를 분리하여 클린 아키텍처로 리팩토링합니다.

✅ **진행 상태 (Status)**
- `Completed` (완료일: 2026-07-22 / 적용 버전: `v0.2.0`)

---

📐 **구현 세부 스펙 (Specifications)**

### 1. 데이터 타입 정의 (`src/types/spot.ts`, `src/types/kakao.d.ts`)
- Supabase `date_spots` 테이블 스키마 대응 TypeScript 인터페이스 정의.
- **주요 타입:**
  - `DateSpot`: `id`, `title`, `description`, `latitude`, `longitude`, `image_url`, `address`, `visited_at`, `created_at`, `deleted_at`

### 2. Custom Hooks 개발 (`src/hooks/`)
- **`useDateSpots.ts`**:
  - `extractStoragePath`: URL 상대 경로 파싱 헬퍼 구현.
  - 레코드 삭제 시 Supabase Storage `date-photos` 버킷 파일 선(先) 삭제 → DB 행 후(後) 삭제 파이프라인 구축.
  - `purgeExpiredDeletedSpots`: 3일(72시간) 경과 Soft-Deleted 항목 스토리지 원본 사진 배치 삭제 연동.
  - `checkAndScheduleAutoDelete`: 10분 경과 `"Test"` 디버깅 레코드 스토리지 사진 자동 동기화 삭제.

### 3. 컴포넌트 모듈화 구조 (`src/components/`)
- **`src/components/modal/SpotDetailSheet.tsx`**:
  - 마커 터치 시 표출되는 종합 요약 바텀 시트 (사진, 메모 전문, 주소, 📍 위경도, 🗑️ 핀 삭제 버튼).
- **`src/components/modal/AddSpotModal.tsx`**:
  - 📍 **'장소'** 단일 필드 통합 및 도로명 주소 placeholder 안내.

---

🛠️ **관련 코드 및 파일 경로 (Implemented & Related Files)**
- `[NEW] src/types/spot.ts`: 데이트 장소 데이터 타입 정의
- `[NEW] src/hooks/useKakaoMap.ts`: Kakao Map 지도 조작 및 핀 선택 훅
- `[NEW] src/hooks/useDateSpots.ts`: Supabase Storage 사진 파일 자동 동기화 삭제 훅
- `[NEW] src/components/modal/SpotDetailSheet.tsx`: 마커 터치 시 표출되는 종합 요약 바텀 시트
- `[MODIFY] CHANGELOG.md`: Storage 사진 연동 삭제 이력 반영

---

⚠️ **유지 관리 시 주의사항 & 체크리스트 (Caveats & Checklist)**
- [x] **Storage 사진 연동 삭제:** DB 레코드 영구 제거 시 Storage 파일이 함께 완전히 삭제되어 용량 누수를 완전 차단.
- [x] **CHANGELOG.md 기재:** 기능 완료 후 `CHANGELOG.md` 내에 한국어로 업데이트 작성.
