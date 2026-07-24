# 변경 이력

이 프로젝트의 모든 주목할 만한 변경 사항이 이 파일에 기록됩니다.

이 포맷은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)를 기반으로 하며,
이 프로젝트는 [유의적 버전](https://semver.org/spec/v2.0.0.html) 규격을 준수합니다.

## [Unreleased]

### 변경
- **지도 푸시 알림 전송 버튼 Popcat 애니메이션 & 1초 쿨다운 적용:** 지도 우측 하단 알림 전송 플로팅 버튼 아이콘을 기존 종 아이콘에서 transparent Popcat 이미지(`popcat_close.png`)로 변경하고, 터치 시 1초간 mouth-open 상태(`popcat_open.png`)로 전이되는 애니메이션 및 연타 방지 쿨다운(1초간 재클릭 차단) 로직을 연동했습니다. ([MapContainer.tsx](file:///c:/dev/our-date-map/src/components/map/MapContainer.tsx))
- **웹 푸시 알림 UI 재배치 & Popcat 버튼 이전:** 기존 헤더 드롭다운 내 "웹 푸시 알림 설정" 카드 행 및 상단 헤더 바 푸시 토글 버튼을 완전히 제거하고, 하단 유저 프로필 카드 내 `[로그아웃]` 버튼 바로 좌측에 Popcat 이미지 아이콘(`popcat_close.png` / `popcat_open.png`) 기반의 보더리스 transparent 푸시 알림 ON/OFF 토글 버튼을 배치했습니다. 터치 시 `active:scale-95` 인터랙션, 모바일 길게 누기 방지(`select-none pointer-events-none`) 및 Supabase 구독 등록/해제 Web Push 핸들러를 동적 연동했습니다. ([Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx))
- **`date_spots` 소프트 삭제 핀 `deleted_date_spots` 휴지통 자동 동기화 트리거 구축 (!DB):** `date_spots` 테이블 내 `deleted_at` 속성이 NOT NULL로 업데이트되거나 과거 삭제된 모든 핀들이 `deleted_date_spots` 휴지통 테이블에 자동으로 기록 및 백필되도록 DB 트리거(`on_date_spot_soft_deleted`) 및 마이그레이션 ([20260724000701_sync_soft_deleted_spots_to_trash_table.sql](file:///c:/dev/our-date-map/supabase/migrations/20260724000701_sync_soft_deleted_spots_to_trash_table.sql))을 적용했습니다.
- **과거 데이트 핀 작성자 일괄 변경 (!DB):** `date_spots` 테이블 내 기존 과거 핀들의 작성자(`created_by`, `user_id`)를 `public.profiles` 테이블의 '민소영' 님 프로필 ID(`811de361-25c0-4afc-b553-2864bbfe463a`)로 일괄 업데이트 마이그레이션 ([20260723234641_update_past_date_spots_creator_to_minsoyong.sql](file:///c:/dev/our-date-map/supabase/migrations/20260723234641_update_past_date_spots_creator_to_minsoyong.sql))을 적용했습니다.
- **작성자 메타데이터 `profiles` 테이블 완전 분리 및 FK 관계 정의 (!DB):** `date_spots` 테이블에서 기존 하드코딩된 작성자 텍스트 컬럼들(`creator_nickname`, `creator_avatar_url`, `creator_profile_image`)을 완전히 제거하고, `auth.users(id)`와 연동되는 `public.profiles` 테이블 생성 마이그레이션 (`20260723233625_decouple_creator_data_to_profiles.sql`)을 적용했습니다. 신규 회원 가입 시 프로필 자동생성 DB 트리거(`on_auth_user_created`) 구축, `date_spots` 내 `created_by` (UUID)를 `public.profiles(id)` 외래키(FK)로 연결, Supabase relational JOIN (`select('*, profiles(id, nickname, profile_image_url)')`) 및 동적 프로필 접근(`spot.profiles.nickname`, `spot.profiles.profile_image_url`)으로 리팩토링했습니다. ([20260723233625_decouple_creator_data_to_profiles.sql](file:///c:/dev/our-date-map/supabase/migrations/20260723233625_decouple_creator_data_to_profiles.sql), [spot.ts](file:///c:/dev/our-date-map/src/types/spot.ts), [useDateSpots.ts](file:///c:/dev/our-date-map/src/hooks/useDateSpots.ts), [SpotDetailSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotDetailSheet.tsx))

### 추가
- **커스텀 푸시 알림 문구 설정 모달 & 찌르기 메시지 동적 연동:** 지도 우측 하단 Popcat 전송 버튼 우상단 연필 설정 아이콘을 클릭하여 푸시 알림 제목 및 본문 문구를 직접 입력하고 빠른 칩 템플릿("지금 뭐해? 🤔", "보고 싶어 💖" 등)을 선택할 수 있는 `CustomPushMessageModal` ([CustomPushMessageModal.tsx](file:///c:/dev/our-date-map/src/components/modal/CustomPushMessageModal.tsx))을 구축했습니다. 설정된 문구는 `localStorage` (`our_date_map_custom_push_message`)에 자동 영구 보존되며, Popcat 터치 시 커스텀 페이로드가 Next.js Push Route Handler ([route.ts](file:///c:/dev/our-date-map/src/app/api/push/send/route.ts)) 및 백그라운드 서비스 워커로 전송되어 상대방 기기 상단 팝업에 실시간 반영됩니다. ([page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx), [MapContainer.tsx](file:///c:/dev/our-date-map/src/components/map/MapContainer.tsx))
- **삭제된 데이트 핀 휴지통 테이블 (`deleted_date_spots`) & 소프트 삭제 메커니즘 구축 (!DB):** 지도 위 데이트 핀 삭제 시 원본 데이터의 하드 삭제를 방지하고 보존/복원할 수 있도록 `deleted_date_spots` 휴지통 전용 테이블 마이그레이션 ([20260724000135_create_deleted_date_spots_table.sql](file:///c:/dev/our-date-map/supabase/migrations/20260724000135_create_deleted_date_spots_table.sql))을 적용했습니다. 핀 삭제 시 전체 스팟 데이터를 JSONB 형태로 `deleted_date_spots`에 백업 기록한 후 `date_spots` 내 `deleted_at = NOW()` 처리하여 지도 조회 쿼리에서 자동 제외되도록 소프트 삭제 워크플로우를 완성했으며, 삭제된 핀을 원상 복원하는 `restoreDateSpot` 헬퍼 메서드를 연동했습니다. ([useDateSpots.ts](file:///c:/dev/our-date-map/src/hooks/useDateSpots.ts), [spot.ts](file:///c:/dev/our-date-map/src/types/spot.ts))
- **프로필 수정 모달 & DB/스토리지 동기화 파이프라인 (!DB):** 헤더 드롭다운 내 사용자 카드를 클릭 시 오픈되는 프로필 수정 모달 ([ProfileEditModal.tsx](file:///c:/dev/our-date-map/src/components/modal/ProfileEditModal.tsx))을 구축하고, `browser-image-compression` 기반 300KB 이하 사진 압축 후 Supabase Storage `avatars` 버킷 마이그레이션 (`20260723235156_add_avatars_storage_bucket.sql`) 업로드 및 `public.profiles` 테이블 upsert 업데이트 기능을 구현했습니다. 커스텀 데이터 미존재 시 Kakao OAuth 메타데이터 자동 폴백을 보장하며, 수정 완료 즉시 전역 헤더 및 지도 위 핀 작성자 프로필이 실시간 동기화되도록 연동했습니다. ([useAuth.ts](file:///c:/dev/our-date-map/src/hooks/useAuth.ts), [upload.ts](file:///c:/dev/our-date-map/src/lib/upload.ts), [Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx), [page.tsx](file:///c:/dev/our-date-map/src/app/page.tsx))
- **Web Push 알림 토글 UI & 실시간 전송 파이프라인:** 1번 헤더 프로필 영역 내 커스텀 아이콘 기반 푸시 알림 ON/OFF 토글 버튼([Header.tsx](file:///c:/dev/our-date-map/src/components/common/Header.tsx))과 1번 토글이 ON일 때만 2번 지도 우측 하단 플로팅 알림 전송 버튼([MapContainer.tsx](file:///c:/dev/our-date-map/src/components/map/MapContainer.tsx))을 추가했습니다. 서비스 워커([sw.js](file:///c:/dev/our-date-map/public/sw.js)) 백그라운드 푸시 수신, `push_subscriptions` DB 마이그레이션(`20260723110339_add_push_subscriptions.sql`), Next.js Route Handler ([route.ts](file:///c:/dev/our-date-map/src/app/api/push/send/route.ts)) 및 커스텀 훅 ([useWebPush.ts](file:///c:/dev/our-date-map/src/hooks/useWebPush.ts)) 연동을 통해 커플 상대방에게 즉시 알림을 발송하는 파이프라인을 구사했습니다.
- **회원 UUID (`user_id`) 소유권 연동 & DB 마이그레이션:** `date_spots` 및 `records` 테이블에 `user_id UUID REFERENCES auth.users(id)` 컬럼 추가 마이그레이션 (`20260723103136_add_user_id_to_spots_and_records.sql`) 및 RLS 정책을 적용했습니다. 핀 기록 시 인증된 사용자 세션(`supabase.auth.getUser()`)의 `user_id`를 자동 첨부하고, 핀 상세 보기 시트 ([SpotDetailSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotDetailSheet.tsx))에서 본인 기록일 경우 `(내 기록)` 소유권 뱃지를 노출하도록 구현했습니다. ([useDateSpots.ts](file:///c:/dev/our-date-map/src/hooks/useDateSpots.ts), [AddSpotModal.tsx](file:///c:/dev/our-date-map/src/components/modal/AddSpotModal.tsx), [SpotDetailSheet.tsx](file:///c:/dev/our-date-map/src/components/modal/SpotDetailSheet.tsx))

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
