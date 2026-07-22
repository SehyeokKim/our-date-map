# task-06-map-click-marker-modal

🎯 **목표 (Goal)**
- 모바일(iOS Safari, Android Chrome, 카카오톡 인앱 브라우저 등) 환경에서 지도의 마커 핀 터치 시 카카오 지도 캔버스가 드래그 이벤트를 낚아채어 터치가 유실되던 현상을 `touchstart`, `touchmove`, `pointerdown`, `mousedown` 이벤트 상위 전파 차단(`e.stopPropagation()`) 및 `touchend`/`click` 300ms 디바운스로 강력 수정합니다.
- 마커 핀 터치 시 중간 단계 우회 없이 사진, 데이트 이야기 전문, 날짜, 주소, 📍 위경도, 🗑️ 핀 삭제 버튼이 모두 포함된 종합 바텀 시트(`SpotDetailSheet`)를 **기본 요약 화면**으로 즉시 표출하도록 단일화합니다.
- 단일 거대 파일(`src/app/page.tsx`)을 `.antigravityrules`에 명시된 프로젝트 모듈화 표준에 맞게 컴포넌트(`src/components/`), 데이터 타입(`src/types/`), 커스텀 훅(`src/hooks/`) 단위로 관심사를 분리하여 클린 아키텍처로 리팩토링합니다.

✅ **진행 상태 (Status)**
- `Completed` (완료일: 2026-07-22 / 적용 버전: `v0.2.0`)

---

📐 **구현 세부 스펙 (Specifications)**

### 1. 데이터 타입 정의 (`src/types/spot.ts`, `src/types/kakao.d.ts`)
- Supabase `date_spots` 테이블 스키마 대응 TypeScript 인터페이스 정의.
- `CustomOverlay`: `clickable?: boolean` 추가 선언

### 2. Custom Hooks 개발 (`src/hooks/`)
- **`useKakaoMap.ts`**:
  - 모바일 카카오 지도 드래그 낚아채기 차단: `touchstart`, `touchmove`, `pointerdown`, `mousedown` 이벤트에 `e.stopPropagation()` 추가.
  - 마커 터치 시 종합 데이트 바텀 시트(`SpotDetailSheet`) 100% 직관 표출.
  - 48x48px Touch Area 확보 및 `touch-action: manipulation` 적용.

### 3. 컴포넌트 모듈화 구조 (`src/components/`)
- **`src/components/modal/SpotDetailSheet.tsx`**:
  - 마커 터치 시 100% 즉시 표출되는 종합 요약 바텀 시트 (사진, 메모 전문, 주소, 📍 위경도, 🗑️ 핀 삭제 버튼).
- **`src/components/modal/AddSpotModal.tsx`**:
  - 📍 **'장소'** 단일 필드 통합 및 도로명 주소 placeholder 안내.

---

🛠️ **관련 코드 및 파일 경로 (Implemented & Related Files)**
- `[NEW] src/types/spot.ts`: 데이트 장소 데이터 타입 정의
- `[NEW] src/types/kakao.d.ts`: Kakao Maps 글로벌 인터페이스 선언
- `[NEW] src/hooks/useKakaoMap.ts`: 모바일 카카오지도 이벤트 전파 차단 및 SpotDetailSheet 직접 연결 훅
- `[NEW] src/hooks/useDateSpots.ts`: Supabase CRUD 및 Soft Delete 훅
- `[NEW] src/components/modal/SpotDetailSheet.tsx`: 마커 터치 시 100% 표출되는 종합 요약 바텀 시트
- `[MODIFY] src/app/page.tsx`: 모듈화된 메인 엔트리 (SpotDetailSheet 직접 연결)
- `[MODIFY] CHANGELOG.md`: 모바일 핀 터치 버그 강력 수정 이력 반영

---

⚠️ **유지 관리 시 주의사항 & 체크리스트 (Caveats & Checklist)**
- [x] **모바일 카카오지도 드래그 차단:** 마커 touchstart/pointerdown 전파 차단으로 터치 유실 버그 완벽 차단.
- [x] **기본 요약 화면 일원화:** SpotDetailSheet 단일 바텀 시트 노출.
- [x] **CHANGELOG.md 기재:** 기능 완료 후 `CHANGELOG.md` 내에 한국어로 업데이트 작성.
