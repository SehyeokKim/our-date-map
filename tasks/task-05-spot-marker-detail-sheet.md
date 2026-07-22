# task-05-spot-marker-detail-sheet

🎯 **목표 (Goal)**
- Supabase DB에서 데이트 기록 목록을 패칭하여 카카오 지도 위에 분홍색 하트 아이콘 커스텀 오버레이 마커로 표시합니다.
- 지도의 하트 마커 핀을 터치할 경우, 등록된 추억 사진, 방문 날짜, 장소명, 달콤한 이야기를 감상할 수 있는 바텀 시트를 노출합니다.

✅ **진행 상태 (Status)**
- `Completed` (완료일: 2026-07-21 / 적용 버전: `v0.1.1`)

🛠️ **관련 코드 및 파일 경로 (Implemented Files)**
- `src/app/page.tsx`: `loadDateSpots()`, `renderSpotMarkers()`, `selectedSpot` 상태 및 바텀 시트 상세 보기 UI
- `supabase/schema.sql`: `date_spots` 테이블 패칭 연동

📐 **구현 세부 스펙 (Specifications)**
- **커스텀 하트 마커:** Kakao Maps `CustomOverlay`를 생성하여 분홍색 하트 아이콘 핀을 지정된 위/경도 좌표에 오버레이.
- **이벤트 조작 및 지도 이동:** 마커 터치 시 `e.stopPropagation()`을 실행하여 지도 클릭 이벤트 간섭을 차단하고 `map.panTo()`로 마커 중심 이동.
- **상세 보기 바텀 시트:**
  - `selectedSpot` 상태에 따라 하단 바텀 시트 슬라이드 오픈.
  - 첨부 사진 유무에 따라 상단 그래디언트 히어로 뷰 또는 단순 타이틀 뷰 분기 렌더링.
  - 한국어 날짜 포맷팅 (`toLocaleDateString('ko-KR')`) 적용.
  - 지도 위도/경도 좌표 표시.

⚠️ **유지 관리 시 주의사항 (Caveats & Constraints)**
- 마커 재렌더링 시 기존 마커 오버레이 인스턴스 배열(`overlaysRef.current`)의 모든 오버레이를 `setMap(null)`로 순회 제거하지 않으면 오버레이가 누적되어 지도 성능 저하 및 메모리 누수가 발생합니다.
