# Task 22 — 사용자 테마 커스터마이징 (색상·폰트 등)

## 목표
사용자가 앱의 테마(색상, 폰트 등)를 자유롭게 커스터마이징할 수 있도록 한다.

## 진행 상황
- [x] **1단계 — 설정 진입점 스캐폴딩 (완료):** 지도 햄버거 메뉴에 "설정" 항목을 추가하고, 설정 모달 안에 "테마 설정" 메뉴를 배치. 테마 설정 화면은 현재 placeholder("준비 중") 상태.
- [ ] **2단계 — 테마 설정 상세 기능 (미정):** 구체적인 커스터마이징 항목·UX는 사용자가 추가 설명 예정. 설명을 받은 뒤 이 명세를 갱신하고 구현한다.

## 영향 파일
- `src/components/modal/SettingsModal.tsx` — 설정 모달 (목록 뷰 ↔ 테마 설정 뷰 전환 구조, 상세 기능은 테마 뷰에 추가 예정)
- `src/components/map/MapContainer.tsx` — 햄버거 메뉴 "설정" 항목 (`onOpenSettings` prop)
- `src/app/page.tsx` — `isSettingsOpen` state 및 모달 렌더링
- (예상) `src/app/globals.css` — 테마 변수(CSS custom properties) 정의 시 변경 가능

## DB 변경
- 현재 없음. (테마 설정을 기기 간 동기화하려면 추후 `profiles` 확장 또는 별도 테이블 검토 — `!DB` 플래그 필요)

## 미정 사항 (사용자 설명 대기)
- 커스터마이징 가능한 항목 범위 (색상 팔레트? 개별 색상? 폰트 목록?)
- 저장 위치 (localStorage vs Supabase 동기화)
- 프리셋 테마 제공 여부
