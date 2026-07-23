# 변경 이력

이 프로젝트의 모든 주목할 만한 변경 사항이 이 파일에 기록됩니다.

이 포맷은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)를 기반으로 하며,
이 프로젝트는 [유의적 버전](https://semver.org/spec/v2.0.0.html) 규격을 준수합니다.

## [Unreleased]

### 수정
- **Kakao KOE205 에러 방지 & OAuth Scope 규칙 강화:** 카카오 개발자 콘솔 미설정 항목인 `account_email` 스코프 요청을 완전 차단하기 위해 [`.antigravityrules`](file:///c:/dev/our-date-map/.antigravityrules)에 KOE205 방지 규칙을 엄격 제정하고, `signInWithOAuth` 호출 시 `scopes: 'profile_nickname profile_image'` 및 `queryParams: { scope: 'profile_nickname profile_image' }`를 함께 적용하여 이메일 스코프 자동 포함을 강력 차단했습니다. ([client.ts](file:///c:/dev/our-date-map/src/lib/supabase/client.ts), [.antigravityrules](file:///c:/dev/our-date-map/.antigravityrules))
- **OAuth 로그인 무음 실패 방지 & Trace 로깅 강화:** Kakao OAuth `signInWithOAuth` 호출 시 동적 `redirectTo` (`${origin}/auth/callback`) 및 `scopes` (`profile_nickname profile_image`) 옵션을 정밀 적용하고, Auth Callback Route Handler ([route.ts](file:///c:/dev/our-date-map/src/app/auth/callback/route.ts)) 및 `useAuth` 훅에 상세 서버/클라이언트 로깅 및 명시적 `auth_error` 쿼리 파라미터 전달 로직을 추가하여 세션 교환 실패 시 오류가 무음 무시되지 않도록 보완했습니다. ([client.ts](file:///c:/dev/our-date-map/src/lib/supabase/client.ts), [route.ts](file:///c:/dev/our-date-map/src/app/auth/callback/route.ts), [useAuth.ts](file:///c:/dev/our-date-map/src/hooks/useAuth.ts))

## [0.4.0] - 2026-07-23

### 추가
- **Kakao OAuth 로그인 연동:** Supabase `@supabase/ssr` 라이브러리를 활용하여 카카오 OAuth 간편 로그인 기능 (`signInWithKakao`) 및 Auth Callback Route Handler ([route.ts](file:///c:/dev/our-date-map/src/app/auth/callback/route.ts))를 구현했습니다.
- **데이트 장소 작성자 추적 (Creator Tracking):** `date_spots` 테이블 스키마에 작성자 추적 컬럼 (`created_by`, `creator_nickname`, `creator_avatar_url`) 마이그레이션 (`20260723000000_add_creator_to_date_spots.sql`)을 추가하고, 핀 등록 시 로그인된 카카오 사용자의 닉네임과 프로필 사진을 자동으로 연동하여 기록하도록 개선했습니다. ([useDateSpots.ts](file:///c:/dev/our-date-map/src/hooks/useDateSpots.ts))
- **작성자 정보 시각화:** 핀 상세 보기 시트 ([SpotDetailSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotDetailSheet.tsx)) 상단에 작성자 닉네임과 프로필 배지("작성자: OO")를 노출하여 커플 간 누가 장소를 공유했는지 한눈에 확인할 수 있게 구현했습니다.

### 변경
- **헤더 카카오 프로필 & 로그아웃 UI 통합:** 헤더 드롭다운 메뉴 ([Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx)) 내에 로그인 미인증 시 '카카오로 3초 로그인' 버튼을, 인증 시 사용자 프로필 이미지/닉네임 및 로그아웃 버튼을 추가했습니다.

### 수정
- **카카오 로그인 KOE205 에러 강력 해결:** Supabase Auth 클라이언트가 카카오 OAuth 호출 시 기본값으로 `account_email` 스코프를 자동 첨부하여 발생하던 KOE205 에러를 완벽히 차단하기 위해, `queryParams.scope`를 명시적으로 재정의(`queryParams: { scope: 'profile_nickname profile_image' }`)했습니다. ([client.ts](file:///c:/dev/our-date-map/src/lib/supabase/client.ts))
- **카카오 OAuth 로그인 내비게이션 수정:** `signInWithKakao()` 실행 시 `supabase.auth.signInWithOAuth` 결과로 리턴되는 카카오 OAuth 인가 URL (`data.url`)이 존재할 경우 `window.location.href = data.url;`로 직접 내비게이션을 수행하여, 카카오 인증 페이지 (`https://kauth.kakao.com/oauth/authorize...`)로 올바르게 이동하도록 버그를 수정했습니다. ([client.ts](file:///c:/dev/our-date-map/src/lib/supabase/client.ts))

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
