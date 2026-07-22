# task-03-realtime-gps-tracking

🎯 **목표 (Goal)**
- HTML5 Geolocation API를 통해 사용자의 현재 GPS 위치를 실시간 추적하고, 지도 위에 파동(ping) 애니메이션 커스텀 마커로 위치를 시각화합니다.
- 언제든지 사용자 위치로 지도를 이동할 수 있는 우하단 GPS FAB(Floating Action Button)을 제공합니다.

✅ **진행 상태 (Status)**
- `Completed` (완료일: 2026-07-21 / 적용 버전: `v0.1.1`)

🛠️ **관련 코드 및 파일 경로 (Implemented Files)**
- `src/app/page.tsx`: Geolocation API 조작 (`startTrackingLocation`, `locateUser`), `userOverlayRef` 마커 관리, GPS 버튼 UI
- `src/app/globals.css`: `.custom-user-marker`, `.ping`, `.dot`, `.core` 펄싱 마커 스타일링

📐 **구현 세부 스펙 (Specifications)**
- **실시간 위치 추적:** `navigator.geolocation.watchPosition` (`enableHighAccuracy: true`, `timeout: 15000`, `maximumAge: 0`).
- **커스텀 마커 오버레이:** Kakao Maps `CustomOverlay`를 활용하여 파동 애니메이션이 적용된 HTML 요소를 좌표와 실시간 동기화.
- **최초 위치 자동 포커싱:** 위치 감지 성공 시 1회에 한해 사용자의 현재 좌표로 `mapInstance.panTo()` 실행.
- **GPS 재포커싱 FAB:** 버튼 클릭 시 `locateUser()`를 호출하여 지도를 사용자 좌표 중심으로 이동.

⚠️ **유지 관리 시 주의사항 (Caveats & Constraints)**
- Geolocation API는 브라우저 보안 정책상 HTTPS 또는 `localhost` 환경에서만 동작합니다.
- 마커 파동 애니메이션 클래스는 Tailwind CSS 컴파일러에 의해 Purge되지 않도록 `globals.css` 파일에 직접 순수 CSS로 관리해야 합니다.
