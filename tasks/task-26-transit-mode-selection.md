# Task 26 — 구간별 이동수단 지정 (대중교통 / 자동차)

## 목표
경유지와 경유지 사이의 이동수단을 **사용자가 구간별로 대중교통·자동차 중에서 고르고**, 수단마다 정해진 기준으로 경로를 기록한다.

## 규칙
1. **선택지는 2개**: `대중교통` / `자동차`. (예전의 지하철·버스·지하철+버스 구분은 폐지)
2. **대중교통**: 도보 + 대중교통(지하철·버스 모두) 기준으로 **이동 거리가 가장 짧은 경로** 하나를 자동으로 쓴다. 후보 선택 없음.
3. **자동차**: Kakao Mobility `priority=DISTANCE`로 **이동 거리가 가장 짧은 경로**를 쓴다. (코스 전체 경로선도 같은 기준)
4. **기본값**: 고르지 않으면 대중교통. 한 번 고르면 다시 바꾸기 전까지 유지된다.

## 설계
- `TransitMode = "transit" | "car"`. 선택값은 **도착 경유지**(`PlannedSpot.transitMode`)에 저장 — `date_plans.spots` JSONB이므로 **DB 스키마 변경 없음**.
- 예전 값(`"subway" | "bus" | "both"`)은 `resolveTransitMode`에서 대중교통으로 읽는다. 기존 행 데이터는 건드리지 않는다.
- **대중교통 거리** = ODsay `subPath[].distance` 합(도보 구간 포함). 거리가 같으면 소요시간이 짧은 경로. 700m 이내(-98)는 직선 거리 + 도보 속도(분당 67m)로 기록.
- **자동차 구간**은 구간마다 `/api/directions`(출발·도착만)로 조회해 거리·시간만 저장한다. ODsay를 쓰지 않는다.

## ODsay 쿼터 보호
- `SearchPathType=0` 한 번의 응답에서 최단 경로를 고르므로 **구간당 최대 1회**. (예전의 대체 탐색 재호출 제거)
- **편집 중에만** 호출(`useTransitRoute(..., enabled)`), 조회 시엔 `route_summary`의 저장분만 사용.
- 저장된 결과는 **구간 단위로 재사용** — 수단이 바뀐 구간·없는 구간만 조회한다. (예전엔 한 구간만 달라도 전 구간을 다시 훑었다)
- 클라이언트 캐시: 응답 대기 중인 요청까지 공유(동시 중복 방지) + 성공 결과 `sessionStorage` 보관(새로고침 후 재호출 방지) + **실패 구간 2분간 재호출 금지**.
- 서버 캐시: 성공 응답만 1시간 인메모리 보관(좌표 쌍 키).
- 예전 수단으로 저장된 구간은 편집에 들어갈 때 **구간당 한 번** 새 기준으로 재조회되고, 완료 시 저장되어 이후엔 호출 없음.

## 영향 파일
- `src/types/transit.ts`, `src/types/planner.ts`, `src/lib/transit.ts`, `src/lib/route.ts`, `src/lib/directions.ts`(신규)
- `src/app/api/transit/route.ts` — 최단 거리 선택, 대체 탐색 제거
- `src/app/api/directions/route.ts` — `priority: DISTANCE`
- `src/hooks/useTransitRoute.ts` — 수단별 조회(ODsay/Kakao), 구간 단위 재사용, 캐시
- `src/hooks/useDirections.ts`, `src/hooks/useFuturePlanner.ts`
- `src/components/modal/AddPlannedSpotModal.tsx`, `src/components/modal/FuturePlanSheet.tsx`, `src/app/page.tsx`

## 검증 현황
- [x] `/api/transit` 실호출(용산역→스타필드 고양): 도보 포함 16,692m / 72분 경로 선택 — 거리 = 도보 3구간 + 버스 2구간 합과 일치 (예전 최단 시간 기준은 지하철 62분)
- [x] `/api/directions` 실호출: `priority DISTANCE` 적용 확인, 17.4km
- [ ] 앱에서 구간 수단 전환(대중교통↔자동차) 후 카드 표시·완료 저장·재열람 시 무호출 확인 — 사용자 확인 필요
- [ ] 700m 이내 도보 구간 표시 확인 (쿼터 절약을 위해 에이전트 미호출)

## 범위 밖 (후속)
- 상단 요약 바(거리·시간)는 여전히 코스 전체 자동차 경로 기준 — 구간별 수단 합계로 바꿀지 검토
- 지도 경로선을 구간 수단별(대중교통 노선 / 자동차 도로)로 나눠 그리기
