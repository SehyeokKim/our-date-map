# task-02-kakao-map-integration

🎯 **목표 (Goal)**
- Kakao Maps JavaScript SDK를 Next.js App Router 환경에서 비동기로 안전하게 로드합니다.
- API 키 누락, 미등록 도메인 접근 등 SDK 로드 실패 시 애플리케이션 크래시를 방지하고, 직관적인 글래스모피즘 에러 안내 카드 UI를 노출하여 문제 해결 방법을 제시합니다.

✅ **진행 상태 (Status)**
- `Completed` (완료일: 2026-07-21 / 적용 버전: `v0.1.1`)

🛠️ **관련 코드 및 파일 경로 (Implemented Files)**
- `src/app/page.tsx`: Kakao Map SDK `<Script>` 태그 연동, `onLoad`/`onError` 이벤트 핸들러, `initKakaoMap()` 초기화 및 예외 UI
- `.env.local`: `NEXT_PUBLIC_KAKAO_MAP_KEY` 환경 변수 관리

📐 **구현 세부 스펙 (Specifications)**
- **비동기 스크립트 로딩:** `next/script` 컴포넌트 (`strategy="afterInteractive"`)를 활용하여 메인 렌더링을 방해하지 않고 다이내믹 로드.
- **안전한 초기화 래핑:** `window.kakao.maps.load()` 콜백 내부에서 지도 객체 생성 (`new kakao.maps.Map()`).
- **기본 포커싱:** 초기 센터 좌표로 남산서울타워 (`37.551172, 126.988226`), 줌 레벨 3 설정.
- **예외 처리 UI:** 카카오 개발자 센터 웹 플랫폼 도메인 설정 안내 링크 및 가이드를 담은 에러 카드 UI 반환.

⚠️ **유지 관리 시 주의사항 (Caveats & Constraints)**
- 카카오 개발자 콘솔의 웹 플랫폼 도메인에 개발 및 배포 환경 URL(예: `http://localhost:3000`)이 사전 등록되어 있어야 합니다.
- SDK 로딩 완료 전 `window.kakao` 참조 시 `TypeError`가 발생하지 않도록 비동기 안전 검사를 필수적으로 진행해야 합니다.
