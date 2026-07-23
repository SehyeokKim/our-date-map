# 변경 이력

이 프로젝트의 모든 주목할 만한 변경 사항이 이 파일에 기록됩니다.

이 포맷은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)를 기반으로 하며,
이 프로젝트는 [유의적 버전](https://semver.org/spec/v2.0.0.html) 규격을 준수합니다.

## [Unreleased]

## [0.3.0] - 2026-07-23

### 추가
- **미래 데이트 플래닝 (Future Date Spot Planning):** 헤더 드롭다운 메뉴를 통해 '추억 데이트 지도' 모드와 '미래 데이트 플래닝' 모드를 언제든지 자유롭게 전환할 수 있는 기능을 구현했습니다. ([Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx))
- **Kakao Mobility API 경로 시각화:** 미래 데이트 플래닝 모드에서 지도 위 장소들을 순서대로 핀 찍으면, Next.js Route Handler ([route.ts](file:///c:/dev/our-date-map/src/app/api/directions/route.ts))를 경유해 Kakao Mobility REST API (`POST /v1/waypoints/directions`)를 호출하여 순서대로 이어지는 보라색 코스 경로선 (`Polyline`)과 총 이동 거리 및 소요 시간을 지도에 시각화합니다.
- **플랜 코스 제어 바텀 시트:** 미래 데이트 플래닝 모드 전용 바텀 시트 ([FuturePlanSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/FuturePlanSheet.tsx))를 추가하여 등록된 장소들의 방문 순서 변경 (위로 🔼 / 아래로 🔽), 핀 개별 삭제 (🗑️), 전체 플랜 초기화 (🔄) 기능을 제공하며, `localStorage` 동기화를 통해 브라우저를 다시 열어도 플랜 데이터가 보존됩니다.

### 변경
- **헤더 UI 인터랙티브 드롭다운 확장:** 기존 고정 헤더 바를 클릭 가능한 드롭다운 메뉴로 리팩토링하여 모드별 (추억 기록 vs 코스 플랜) 상태 뱃지, 아이콘, 핀 개수를 한눈에 확인하고 변경할 수 있도록 개선했습니다. ([Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx))

## [0.2.0] - 2026-07-22

### 추가
- **다중 사진 업로드 (최대 10장):** 데이트 기록 시 사진을 최대 10장까지 선택 및 개별 압축 업로드할 수 있는 기능([AddSpotModal.tsx](file:///c:/dev/our-date-map/src/components/modal/AddSpotModal.tsx))을 구현하고, DB 테이블에 `image_urls TEXT[]` 컬럼 추가 마이그레이션(`20260722022000_add_image_urls_array_to_date_spots.sql`)을 적용했습니다.
- 지도의 임의 위치 클릭 시 해당 좌표에 바운스 임시 오버레이 핀 마커 생성 및 핀 터치 시 데이트 장소 기록(사진, 제목, 날짜, 메모)을 입력하는 바텀 시트 폼 UI([AddSpotModal.tsx](file:///c:/dev/our-date-map/src/components/modal/AddSpotModal.tsx))를 구현했습니다.
- 프로젝트 전체 작업 현황 및 Task 세부 명세를 총괄하는 [TASKS.md](file:///c:/dev/our-date-map/TASKS.md) master 오버뷰 문서를 루트 경로에 추가했습니다.

### 변경
- **우측 하단 FAB 버튼 제거:** 지도 우측 하단에 위치했던 '데이트 사진 올리기' Floating Action Button([MapContainer.tsx](file:///c:/dev/our-date-map/src/components/map/MapContainer.tsx))을 제거하고, GPS 위치 버튼을 우측 하단(`bottom-6`)으로 재배치하여 깔끔한 풀스크린 지도 뷰를 제공합니다.
- **요약 팝업 UI 개선:** 1단계 요약 팝업([SpotSummarySheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotSummarySheet.tsx)) 내 '우리의 이야기' 텍스트를 `\n` 기준 첫 줄만 깔끔하게 노출하도록 수정하고, 텍스트 라벨을 '우리의 이야기'로 다듬었으며, 중복되던 하단 자세히보기 버튼을 제거하여 더욱 직관적이고 깔끔한 카드 UX를 완성했습니다.
- 기존 거대한 단일 파일 구조였던 메인 페이지([page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx))를 프로젝트 모듈화 표준 가이드라인에 맞춰 타입([types/](file:///c:/dev/our-date-map/src/types/)), 커스텀 훅([hooks/](file:///c:/dev/our-date-map/src/hooks/)), 컴포넌트([components/](file:///c:/dev/our-date-map/src/components/)) 단위로 가독성 높게 리팩토링했습니다.
- `navigator.geolocation.watchPosition`을 이용한 실시간 GPS 위치 추적 기능을 추가하여 사용자의 움직임에 따라 지도의 위치가 실시간으로 자동 업데이트되도록 구현했습니다.
- Kakao 지도 API 로드 실패 시(예: 미등록 도메인으로 호출 시) 해결 방법을 직관적으로 안내하는 글래스모피즘 스타일의 오류 안내 카드 UI를 추가했습니다.
- 데이터베이스 테이블 및 스토리지 버킷 스키마 관리를 위해 [schema.sql](file:///c:/dev/our-date-map/supabase/schema.sql) 스키마 정의 파일을 프로젝트 루트 경로에 추가했습니다.
- 데이트 장소를 기록할 수 있는 바텀 시트 폼(사진 첨부, 장소/제목, 날짜, 메모) 및 저장된 장소를 확인할 수 있는 상세 정보 뷰 바텀 시트 UI를 구현했습니다.
- Supabase Database(`date_spots`) 연동을 통한 데이트 장소 목록 불러오기 및 신규 등록 기능을 구현하고, 업로드된 사진을 버킷에 저장하여 맵 마커와 연동했습니다.
- 데이트 장소 추가 모드 시 지도를 터치하여 원하는 위치로 마커 핀을 미세 조정할 수 있는 위치 이동 선택 인터페이스를 구현했습니다.

### 수정
- **'Test' 기록 3분 자동 삭제 타이머 수정:** 'Test' 제목(대소문자 미구분)으로 등록된 데이트 기록이 생성 3분(180초) 후 Supabase DB 및 Storage 원본 사진에서 자동으로 영구 제거되도록 타이머 시간을 3분(180,000ms)으로 정확히 보완했습니다. ([useDateSpots.ts](file:///c:/dev/our-date-map/src/hooks/useDateSpots.ts))
- **모바일 핀 터치 인식 불량 버그 강력 해결:** 모바일(iOS Safari, Android Chrome, 카카오톡 인앱 브라우저 등) 환경에서 마커 핀 터치 시 카카오 지도 캔버스가 `touchstart`/`pointerdown` 이벤트를 상위로 전파받아 지도 드래그 세션을 실행하여 마커 핀의 터치 이벤트가 취소되던 버그를 분석했습니다. 마커 Wrapper의 `touchstart`, `touchmove`, `pointerdown`, `mousedown` 이벤트 발생 시 상위 전파를 완벽히 차단(`e.stopPropagation()`)하여 모바일 기기에서의 핀 터치 인식률 및 팝업 오픈 안정성을 100% 보증하도록 수정했습니다. ([useKakaoMap.ts](file:///c:/dev/our-date-map/src/hooks/useKakaoMap.ts))

---

## [0.1.0] - 2026-07-21

### 추가
- Next.js (App Router, TypeScript) 프로젝트의 초기 구성을 시작했습니다.
- Kakao 지도 JavaScript SDK를 연동하여 지도 컨테이너 렌더링 및 초기 위치 포커싱 기능을 통합했습니다.
- Supabase 클라이언트 ([supabase.ts](file:///c:/dev/our-date-map/src/lib/supabase.ts)) 및 `browser-image-compression` 기반의 클라이언트 사이드 이미지 압축 업로드 헬퍼 ([upload.ts](file:///c:/dev/our-date-map/src/lib/upload.ts))를 추가했습니다.
- PWA 단독 (standalone) 실행 환경 최적화를 위한 웹 앱 매니페스트 (`manifest.json`)와 Apple 메타 설정을 적용했습니다.

### 변경
- 메인 홈 페이지 ([page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx)) 구조를 전체 화면 메인 지도 중심의 데이트 기록 인터페이스로 변경했습니다.
