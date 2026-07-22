# task-01-pwa-mobile-layout

🎯 **목표 (Goal)**
- 모바일 브라우저 및 iOS/Android PWA 단독(standalone) 실행 환경에 최적화된 풀스크린 레이아웃을 구축합니다.
- 모바일 핀치 줌 방지, PWA 웹 앱 매니페스트, iOS 메타데이터, Glassmorphism 디자인이 적용된 헤더 바를 구현하여 네이티브 앱과 동일한 사용 경험(App-like UX)을 제공합니다.

✅ **진행 상태 (Status)**
- `Completed` (완료일: 2026-07-21 / 적용 버전: `v0.1.0`)

🛠️ **관련 코드 및 파일 경로 (Implemented Files)**
- `src/app/layout.tsx`: `Metadata` & `Viewport` 설정 (`userScalable: false`, `appleWebApp`, `themeColor: #ffffff`)
- `public/manifest.json`: Web App Manifest 정의 (`display: standalone`, `start_url: /`, PWA 아이콘 및 명칭)
- `src/app/page.tsx`: 헤더 바 및 `w-screen h-screen overflow-hidden` 레이아웃 컨테이너
- `src/app/globals.css`: 풀스크린 뷰포트 및 모바일 스크롤 비활성화 기본 스타일링

📐 **구현 세부 스펙 (Specifications)**
- **Next.js App Router Viewport API:** `initialScale: 1`, `maximumScale: 1`, `userScalable: false` 설정을 통한 모바일 핀치 줌 방지.
- **iOS Standalone 지원:** `appleWebApp` 메타데이터 (`capable: true`, `statusBarStyle: "default"`, `title: "데이트지도"`) 설정.
- **Web App Manifest:** `public/manifest.json`을 통해 모바일 홈 화면 추가 시 주소창 없는 독립형 앱 형태로 동작하도록 보장.
- **Glassmorphic UI 헤더:** Tailwind CSS `backdrop-blur-md`, `bg-white/80`, `border-white/50`을 활용한 상단 비주얼 헤더 바.

⚠️ **유지 관리 시 주의사항 (Caveats & Constraints)**
- `userScalable: false` 설정으로 인해 브라우저 기본 확대/축소가 차단되므로, 제스처 줌 조작은 지도 SDK 영역 내로 한정되어야 합니다.
- PWA 매니페스트 변경 시 브라우저 캐시로 인해 즉시 반영되지 않을 수 있으므로 Chrome DevTools > Application 탭에서 정기적으로 검증하십시오.
