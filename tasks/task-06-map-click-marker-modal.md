# task-06-map-click-marker-modal

🎯 **목표 (Goal)**
- 데이트 기록 등록 시 **최대 10장의 사진 다중 선택 및 자동 압축 업로드**를 지원하고, PostgreSQL- 데이터베이스 `date_spots` 레코드가 완전 삭제(Hard-Delete)되거나 3일 Soft-Delete 경과 및 3분 "Test" 자동삭제 시, Supabase Storage(`date-photos` 버킷) 내에 저장되어 있던 **원본 이미지 파일이 100% 동기화되어 완전 삭제**되는 파이프라인을 연동합니다.
- 지도의 마커 터치 시 **1단계 요약 팝업(`SpotSummarySheet`) ➔ 2단계 전체 자세히보기 팝업(`SpotDetailSheet`)** 2단계 뷰 모델 구조를 재구축합니다.
  - 1단계 요약 팝업: 대표 사진 1장, 1줄 메모 미리보기, 클릭 가능한 장소 제목 링크 포함 (핀 삭제 버튼 없음).
  - 2단계 자세히보기 팝업: 최대 10장 전체 사진 캐러셀 갤러리, 메모 전문, 📍 위경도, 🗑️ 핀 삭제 버튼 포함 (삭제 시 등록된 모든 사진 스토리지 일괄 삭제 연동).
- 단일 거대 파일(`src/app/page.tsx`)을 `.antigravityrules`에 명시된 프로젝트 모듈화 표준에 맞게 컴포넌트(`src/components/`), 데이터 타입(`src/types/`), 커스텀 훅(`src/hooks/`) 단위로 관심사를 분리하여 클린 아키텍처로 리팩토링합니다.

✅ **진행 상태 (Status)**
- `Completed` (완료일: 2026-07-22 / 적용 버전: `v0.2.0`)

---

📐 **구현 세부 스펙 (Specifications)**

### 1. 데이터 타입 및 마이그레이션 (`src/types/spot.ts`, `supabase/migrations/`)
- `20260722022000_add_image_urls_array_to_date_spots.sql`: `image_urls TEXT[] DEFAULT '{}'` 컬럼 마이그레이션.
- `DateSpot` 타입: `image_urls?: string[]` 속성 정의.

### 2. Custom Hooks & Upload (`src/lib/upload.ts`, `src/hooks/useDateSpots.ts`)
- `uploadCompressedPhotos`: 최대 10장 다중 이미지 개별 압축 후 Supabase Storage 업로드.
- `hardDeleteSpotInternal` & `purgeExpiredDeletedSpots`: `image_urls` 배열 내 모든 사진 파일 Supabase Storage 일괄 연동 삭제.

### 3. 2단계 컴포넌트 구조 (`src/components/modal/`)
- **`AddSpotModal.tsx`**: 최대 10장 사진 다중 선택(`multiple`), 미리보기 썸네일 그리드 및 삭제 기능.
- **`SpotSummarySheet.tsx`**: 1단계 요약 화면 (대표 사진 1장, \n 기준 첫줄 메모만 표시, '우리의 이야기' 라벨, 클릭 가능한 제목 링크, 핀 삭제 및 자세히보기 하단 버튼 제거).
- **`SpotDetailSheet.tsx`**: 2단계 전체 자세히보기 화면 (최대 10장 갤러리 슬라이더 캐러셀, 메모 전문, 📍 위경도, 🗑️ 핀 삭제 버튼).

---

🛠️ **관련 코드 및 파일 경로 (Implemented & Related Files)**
- `[NEW] supabase/migrations/20260722022000_add_image_urls_array_to_date_spots.sql`: image_urls 마이그레이션 SQL
- `[NEW] src/types/spot.ts`: image_urls가 포함된 DateSpot 타입
- `[NEW] src/lib/upload.ts`: 다중 사진 압축 업로드 모듈
- `[NEW] src/hooks/useDateSpots.ts`: 다중 사진 동기화 삭제 CRUD 훅
- `[NEW] src/components/modal/SpotSummarySheet.tsx`: 1단계 요약 바텀 시트
- `[NEW] src/components/modal/SpotDetailSheet.tsx`: 2단계 전체 자세히보기 바텀 시트
- `[MODIFY] CHANGELOG.md`: 다중 사진 및 2단계 뷰 변경 이력 반영

---

⚠️ **유지 관리 시 주의사항 & 체크리스트 (Caveats & Checklist)**
- [x] **다중 사진 업로드:** 최대 10장 사진 개별 압축 업로드 및 image_urls 배열 저장.
- [x] **2단계 뷰 모델:** 요약 팝업(사진 1장/1줄 메모/삭제버튼없음) ➔ 제목 클릭 시 자세히보기(사진 10장 캐러셀/메모전문/핀삭제버튼).
- [x] **CHANGELOG.md 기재:** 기능 완료 후 `CHANGELOG.md` 내에 한국어로 업데이트 작성.
