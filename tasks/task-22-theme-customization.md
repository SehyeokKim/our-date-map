# Task 22 — 사용자 테마 커스터마이징 (색상·폰트 등)

## 목표
사용자가 앱의 테마(색상, 폰트)를 자유롭게 커스터마이징할 수 있도록 한다.
디자인 기준: Claude Design 프로젝트 `Theme Guideline.dc.html` (색상 3종 × 폰트 3종, 토큰 기반).
핵심 원칙: **컴포넌트는 색을 모르고, 테마만 색을 안다** — 컴포넌트에서 Tailwind 팔레트 색(`rose-500` 등) 직접 사용 금지, 역할 토큰(`memory`/`plan`/`warn`/`ink`/`surface`…)만 사용.

## 진행 상황
- [x] **1단계 — 설정 진입점:** 햄버거 메뉴 "설정" + 설정 모달 내 "테마 설정" 메뉴.
- [x] **2단계 — 테마 인프라 & 설정 UI (완료):**
  - 색상 테마 3종(`sage` 세이지 / `citrus` 시트러스 / `peach` 나이트 피치)과 폰트 3종(`gowun-noto` / `gothic-plex` / `gowun-plex`)을 **독립된 축**으로 분리 (`<html data-theme>` / `<html data-font>`).
  - `globals.css`에 역할 토큰 + Tailwind v4 `@theme inline` 브리지 + `.font-display`/`.font-body` 클래스. 기존 `--background`/`prefers-color-scheme` 블록 제거(다크는 OS가 아닌 `data-theme="peach"`가 결정).
  - `layout.tsx`: 첫 페인트 전 블로킹 스크립트로 localStorage(`odm-theme`/`odm-font`) 값을 `<html>`에 주입(플래시 방지), Google Fonts 4종 로드, `theme-color`는 useTheme이 런타임 갱신.
  - `useTheme` 훅 = 테마 변경 단일 진입점. 상수/메타데이터는 `src/lib/theme.ts`.
  - 설정 모달 테마 화면: 색상 스와치 3개 + 폰트 3개(옵션 자체를 해당 폰트로 렌더) 선택 → **미리보기 카드**(선택값을 `data-theme`/`data-font` 스코프로 카드에만 반영) → **"적용하기"** 버튼으로 확정.
- [x] **공용 셸 토큰화 (완료):** Header, MapContainer(햄버거 메뉴·FAB·로딩/에러 화면), Toast, page 배경, 사용자 위치 마커 CSS.
- [ ] **3단계 — 모달 12종 토큰 치환 (예정):** `src/components/modal/`의 나머지 모달(AddSpotModal, SpotDetailSheet, SpotListModal, TrashModal, FuturePlanSheet 등)에 하드코딩된 `rose-*`/`gray-*`/`violet-*`/`amber-*`를 치환 사전대로 토큰화. 현재는 어느 테마에서든 기존 로즈 라이트 스타일로 표시됨(나이트 피치에서 모달만 밝게 뜸).
- [ ] **4단계 — 지도 레이어 (예정):** `useKakaoMap`이 문자열로 만드는 커스텀 오버레이/하트 마커 HTML에 `var(--memory)` 등 토큰 직접 주입, `manifest.json` 점검.

## 치환 사전 (3단계에서 사용)
`bg-white→bg-surface`, `bg-gray-50/100→bg-surface-2`, `border-gray-100/200→border-line`, `text-gray-800/900→text-ink`, `text-gray-500/600→text-ink-muted`, `text-gray-300/400→text-ink-subtle`, `rose-500/600→memory/memory-strong`, `bg-rose-50→bg-memory-tint`, `border-rose-100→border-memory-line`, `violet/purple-*→plan 계열`, `amber-*→warn 계열`, `slate-*→surface-2+ink-muted`, CTA 위 `text-white→text-on-accent`, `focus:ring-rose-500→focus:ring-memory`.
삭제 대상: 그라데이션(`from-rose-500 to-pink-500`)→단색 `bg-memory`, 흰색 알파(`bg-white/80`)→불투명 `bg-surface`, `shadow-rose-200`→`shadow-[var(--shadow-card)]`.

## 영향 파일
- `src/app/globals.css`, `src/app/layout.tsx` — 토큰·폰트·초기화 스크립트
- `src/lib/theme.ts`, `src/hooks/useTheme.ts` — 상수·단일 진입점 훅
- `src/components/modal/SettingsModal.tsx` — 색상/폰트 선택 + 미리보기 + 적용
- `src/components/common/Header.tsx`, `Toast.tsx`, `src/components/map/MapContainer.tsx`, `src/app/page.tsx` — 공용 셸 토큰화 (완료)
- (예정) `src/components/modal/*` 나머지, `src/hooks/useKakaoMap.ts`

## DB 변경
- 현재 없음. 테마는 기기별 localStorage 저장. "우리 커플 테마"로 공유하려면 추후 `profiles.theme` 컬럼 검토 (`!DB` 플래그 필요).

## 유지 규칙 (새 UI 체크리스트)
1. PR에 `#[0-9a-f]{6}`나 Tailwind 팔레트 색 유틸이 새로 들어오면 리젝.
2. 새 화면은 나이트 피치(다크)에서 먼저 확인.
3. 제목엔 `font-display`(굵기는 `--display-weight`에 위임, `font-bold` 직접 금지), 그 외 `font-body`.
4. 토큰이 없어 보이면 새 색을 만들지 말고 역할(memory/plan/warn/ink)을 먼저 정한다.
