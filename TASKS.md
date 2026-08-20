# 우리들의 데이트 지도 (Our Date Map) - 작업 현황 (`TASKS.md`)

프로젝트의 작업 현황을 한눈에 보는 총괄 인덱스입니다.

- **진행 중/예정 작업**: 아래 [진행 중 / 예정](#-진행-중--예정-in-progress--planned) 섹션에 나열하고, 규모가 큰 작업은 `tasks/task-XX-<이름>.md`에 작업 명세를 작성합니다. **완료되면 명세 파일은 삭제**하고 아래 완료 표에 한 줄로 요약합니다.
- **완료 작업의 상세 이력**: 구현 세부 내용은 [CHANGELOG.md](CHANGELOG.md)와 git 히스토리를 참조합니다.

---

## 🚧 진행 중 / 예정 (In Progress / Planned)

- **데이트 플래너 플랜 생성/편집 시나리오 재정립** — 명세: [tasks/task-24-plan-creation-flow.md](tasks/task-24-plan-creation-flow.md)
  - 구현 완료: 생성 즉시 DB 등록, 완료 시 저장, 지도 클릭 추가 폐지, 경유지 추가 · 핀으로 추가.
  - 남은 확인: DB 쓰기 경로(생성·완료 저장)는 `!DB` 미지정으로 에이전트 미검증 — 사용자 확인 필요.
- **커플 단위 공용 설정 (couples 테이블)** — 명세: [tasks/task-25-couple-shared-settings.md](tasks/task-25-couple-shared-settings.md)
  - 완료: 테이블·`profiles.couple_id`·RLS·백필 적용, 테마/폰트 커플 공유.
  - 후속: 실시간 반영(Realtime), 커플 해제·재지정 정리, 초대 흐름.

---

## ✅ 완료 (Completed) — 현재 버전: `v0.9.2`

| # | 작업 | 완료일 | 버전 | 핵심 파일 |
| --- | --- | --- | --- | --- |
| 01 | PWA standalone 최적화 & 모바일 풀스크린 레이아웃 | 07-21 | v0.1.0 | `src/app/layout.tsx`, `public/manifest.json` |
| 02 | Kakao Map SDK 비동기 로드 & 로드 실패 안내 UI | 07-21 | v0.1.1 | `src/app/page.tsx` |
| 03 | 실시간 GPS 추적(`watchPosition`) & 펄싱 위치 마커 | 07-21 | v0.1.1 | `src/app/page.tsx`, `src/app/globals.css` |
| 04 | Supabase DB·Storage 업로드 파이프라인 (300KB 클라이언트 압축) | 07-21 | v0.1.0 | `src/lib/upload.ts`, `supabase/schema.sql` |
| 05 | 데이트 장소 하트 마커 & 상세 바텀 시트 | 07-21 | v0.1.1 | `src/app/page.tsx` |
| 06 | 다중 사진 업로드(최대 10장, `image_urls TEXT[]`) & 2단계 요약/상세 팝업 | 07-22 | v0.2.0 | `src/components/modal/SpotSummarySheet.tsx`, `SpotDetailSheet.tsx`, `AddSpotModal.tsx` |
| 07 | 미래 데이트 플래닝 모드 & Kakao Mobility 경로(Polyline) 시각화 | 07-23 | v0.3.0 | `src/app/api/directions/route.ts`, `src/hooks/useFuturePlanner.ts`, `src/components/modal/FuturePlanSheet.tsx` |
| 08 | Kakao OAuth 로그인 & 작성자 추적 (KOE205 방지 스코프 재정의) | 07-23 | v0.4.0 | `src/lib/supabase/client.ts`, `src/app/auth/callback/route.ts`, `src/hooks/useAuth.ts` |
| 09 | Web Push 알림 토글 & Popcat 전송 버튼 & 커스텀 문구 모달 | 07-24 | v0.5.0 | `public/sw.js`, `src/hooks/useWebPush.ts`, `src/app/api/push/send/route.ts` |
| 10 | 작성자 메타데이터 `public.profiles` 테이블 분리 (FK 관계형 JOIN) | 07-24 | v0.4.0 | `supabase/schema.sql`, `src/hooks/useDateSpots.ts` |
| 11 | 프로필 수정 모달 & `avatars` 스토리지/DB 동기화 | 07-24 | v0.4.0 | `src/components/modal/ProfileEditModal.tsx`, `src/hooks/useAuth.ts` |
| 12 | 삭제 핀 휴지통(`deleted_date_spots`) & 소프트 삭제/복원 | 07-24 | v0.4.0 | `src/hooks/useDateSpots.ts`, `supabase/schema.sql` |
| 13 | ODsay 대중교통 길찾기 연동 & 구간별 이동 정보 카드 | 07-24 | v0.6.0 | `src/app/api/transit/route.ts`, `src/hooks/useTransitRoute.ts` |
| 14 | 날짜 선택 기반 플랜 `date_plans` DB 영구 저장/복원 | 07-24 | v0.7.0 | `src/hooks/useFuturePlanner.ts`, `src/types/planner.ts` |
| 15 | 순수 지도 기본 화면 & 과거/미래 일정 목록 모달 (기간 설정) | 07-24 | v0.8.0 | `src/components/modal/DateItineraryModal.tsx`, `CreateDatePlanModal.tsx` |
| 16 | 코스 경로(`route_summary` JSONB) 영구 저장 & 재호출 방지 캐싱 | 07-27 | - | `src/hooks/useFuturePlanner.ts`, `src/hooks/useTransitRoute.ts` |
| 17 | 푸시 알림 전송 이력 `push_messages` DB 기록 | 07-27 | - | `src/app/api/push/send/route.ts`, `supabase/schema.sql` |
| 18 | 데이트 코스 상세 드로어 UI 개선 & 경로 표시 제어 튜닝 | 07-27 | - | `src/components/modal/FuturePlanSheet.tsx`, `src/components/common/Header.tsx` |
| 19 | 메모 들여쓰기 정렬 & 플래닝 진입 시 핀/경로 은닉 제어 | 07-27 | v0.9.2 | `src/components/modal/FuturePlanSheet.tsx`, `src/app/page.tsx` |
| 20 | 지도 햄버거 메뉴 (추억 모아보기·주소로 추가·휴지통·현재 위치로) & 기록 수정 & 핀 복원 | 08-14 | - | `src/components/map/MapContainer.tsx`, `src/components/modal/SpotListModal.tsx`, `AddressSearchModal.tsx`, `TrashModal.tsx`, `src/hooks/useAddressSearch.ts`, `useDateSpots.ts` |
| 21 | 데이트 기록 동영상 업로드·재생 (원본 업로드, 핀당 30MB 초과 경고, `video_urls` 컬럼) | 08-14 | - | `supabase/migrations/20260814073021_*.sql`, `src/lib/upload.ts`, `src/hooks/useDateSpots.ts`, `src/components/modal/AddSpotModal.tsx`, `SpotDetailSheet.tsx` |
| 22 | 테마 커스터마이징 — 색상 3종(세이지·시트러스·나이트 피치) × 폰트 3종 독립 선택, 미리보기 후 적용, 전 UI·지도 마커 토큰화 | 08-20 | - | `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/theme.ts`, `src/hooks/useTheme.ts`, `src/components/modal/SettingsModal.tsx`, `src/hooks/useKakaoMap.ts` |
| 23 | 코스 상세 수정 모드(순서 조정·삭제 이동) & 검색 기반 경유지 추가 | 08-20 | - | `src/components/modal/FuturePlanSheet.tsx`, `src/components/modal/AddressSearchModal.tsx`, `src/app/page.tsx` |

> 완료일은 2026년 기준. 버전 `-`는 릴리스 태그 미지정 작업(상세는 `CHANGELOG.md` [Unreleased] 참조).
