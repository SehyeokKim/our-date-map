# [Task 07] 미래 데이트 플래닝 & 카카오모빌리티 길찾기 코스 시각화

## 📌 작업 개요
- **버전:** `v0.3.0`
- **구현일:** 2026-07-23
- **주요 목적:** 헤더 드롭다운 메뉴를 통해 "추억 데이트 지도" 모드와 "미래 데이트 플래닝" 모드를 자유롭게 전환하고, 앞으로 방문할 커플 데이트 장소를 순서대로 핀 찍어 Kakao Mobility API (`/api/directions`)를 통해 경로 코스(Polyline) 및 거리/시간 정보를 시각화합니다.

---

## 🛠️ 세부 요구사항 & 구현 내역

### 1. 헤더 UI 드롭다운 메뉴 확장 (`Header.tsx`)
- 헤더 클릭 시 Glassmorphic 인터랙티브 드롭다운 메뉴 토글.
- `추억 데이트 지도` (기존 저장 핀 모드) 및 `미래 데이트 플래닝` (코스 등록 & 길찾기 모드) 전환 지원.
- 각 모드별 개수 뱃지(Memory Spots vs Planned Spots) 및 상태 라벨 표시.

### 2. 미래 데이트 플래닝 모드 (`useFuturePlanner.ts` & `FuturePlanSheet.tsx`)
- 지도 클릭 시 해당 좌표의 역지오코딩 주소를 불러와 순서(1, 2, 3...)가 부여된 플랜 핀 생성 (`AddPlannedSpotModal.tsx`).
- 하단 바텀 시트(`FuturePlanSheet.tsx`)를 통해 플랜 장소 순서 변경(위로 🔼 / 아래로 🔽), 핀 삭제(🗑️), 전체 초기화(🔄) 지원.
- `localStorage` 자동 동기화를 통해 브라우저 새로고침 후에도 미래 데이트 플랜 보존.

### 3. Kakao Mobility API 연동 경로 시각화 (`route.ts` & `useDirections.ts`)
- Next.js Route Handler (`src/app/api/directions/route.ts`)를 경유한 카카오모빌리티 다중 경유지 API (`POST /v1/waypoints/directions`) 연동.
- 서버 사이드 `KAKAO_REST_API_KEY` 보안 래핑.
- 2개 이상의 플랜 핀 등록 시 경로 vertexes 좌표 추출 ➔ Kakao Map 보라색 `Polyline` (`#8B5CF6`) 코스선 렌더링.
- 총 이동 거리(km/m) 및 예상 소요 시간 시각화. API 실패 시 직선 연결 예외 처리 파이프라인 탑재.

---

## 📁 관련 핵심 코드 파일
- `src/app/api/directions/route.ts`: Kakao Mobility REST API 호출 라우트 핸들러
- `src/types/planner.ts`: 미래 플래닝 데이터 모델 및 타입 정의
- `src/hooks/useFuturePlanner.ts`: 미래 플래닝 상태 관리 및 localStorage 연동 훅
- `src/hooks/useDirections.ts`: 길찾기 API 연동 및 좌표 추출 훅
- `src/hooks/useKakaoMap.ts`: 번호 핀 오버레이 및 Polyline 경로선 지도 렌더링 훅
- `src/components/common/Header.tsx`: 모드 전환 인터랙티브 드롭다운 헤더
- `src/components/modal/AddPlannedSpotModal.tsx`: 미래 데이트 장소 추가 모달
- `src/components/modal/FuturePlanSheet.tsx`: 미래 데이트 코스 제어 바텀시트
- `src/app/page.tsx`: 메인페이지 통합 컨트롤러
