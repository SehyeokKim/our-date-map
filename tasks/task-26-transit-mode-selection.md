# Task 26 — 구간별 이동수단 직접 지정 (ODsay)

## 목표
경유지와 경유지 사이의 이동수단이 ODsay가 주는 대로 정해지던 것을, **사용자가 구간별로 직접 고르고** 그 수단으로 ODsay에서 경로를 받아오도록 한다.

## 규칙
1. **기본값**: 출발·도착이 모두 수도권 전철권이면 `지하철`, 아니면 `지하철+버스`.
2. **고정**: 사용자가 한 번 고르면 다시 바꾸기 전까지 유지된다(자동 재판정 없음).

## 설계
- `TransitMode = "subway" | "bus" | "both"` → ODsay `SearchPathType` 1 / 2 / 0.
- 선택값은 **도착 경유지**(`PlannedSpot.transitMode`)에 저장한다. "직전 경유지에서 이 장소로 오는 수단"이라는 뜻이라, 경유지를 추가할 때 그 자리에서 고르는 흐름과 맞는다. `date_plans.spots` JSONB에 그대로 들어가므로 **DB 스키마 변경 없음**.
- 미지정(`undefined`)일 때만 좌표 기반 기본값을 쓴다 → 규칙 2가 자연히 지켜진다.
- **수도권 판정**은 좌표 사각형 근사(`src/lib/transit.ts`). 위도 36.7–38.3 / 경도 126.3–127.95로 서울·인천·경기 전역과 천안·아산, 춘천, 여주까지 포함. 경계 부근은 부정확할 수 있으나 어디까지나 기본값이고 사용자가 바꿀 수 있다.
- **캐시**: 같은 좌표쌍이라도 수단이 다르면 다른 경로이므로 캐시 키와 저장된 `route_summary` 재사용 판정에 수단을 포함한다.
- **대체 탐색**: 고른 수단으로 경로가 없으면(지하철 없는 지역 등) `지하철+버스`로 **한 번만** 재조회하고 `fallbackApplied`로 표시한다. 실패한 구간에서만 발생하므로 쿼터 영향은 제한적.

## 영향 파일
- `src/lib/transit.ts` (신규), `src/types/transit.ts`, `src/types/planner.ts`
- `src/app/api/transit/route.ts` — `mode` 파라미터 → `SearchPathType`, 대체 탐색
- `src/hooks/useTransitRoute.ts` — 구간별 수단 적용, 캐시 키/재사용 판정
- `src/hooks/useFuturePlanner.ts` — `addSpot(..., transitMode)`, `setSpotTransitMode`
- `src/components/modal/AddPlannedSpotModal.tsx` — 추가 시 수단 선택
- `src/components/modal/FuturePlanSheet.tsx` — 구간 카드에서 수단 변경
- `src/app/page.tsx` — 배선 및 기본값 계산

## 검증 현황
- [x] 수도권 코스에서 세 구간 모두 기본값이 `지하철`로 잡힘
- [x] 구간별로 수단을 바꾸면 도착 경유지에 저장되고 선택 상태가 유지됨
- [x] `/api/transit` 요청에 구간별 `mode`가 정확히 실림 (bus / both / subway)
- [ ] **ODsay 실제 경로 비교 — 불가**. 현재 `ODSAY_API_KEY`가 `[ApiKeyAuthFailed] ApiKey authentication failed`를 반환한다.
      `SearchPathType` 유무와 무관하게 동일하게 실패하므로 **이번 변경과 무관한 기존 문제**이며,
      키 재발급 또는 ODsay 콘솔의 허용 도메인(Referer) 등록 확인이 필요하다. 키가 살아나면 수단별 경로 차이를 확인해야 한다.

## 범위 밖 (후속)
- 자동차·도보 등 ODsay 밖의 이동수단
- 구간별 예상 요금·환승 정보를 수단 선택 UI에 미리 보여주기
