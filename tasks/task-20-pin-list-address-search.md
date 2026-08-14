# [Task 20] 핀 목록 조회 버튼 & 주소 검색 핀 등록

- **상태:** `In Progress` (시작일: 2026-08-14)
- **브랜치:** `feat/pin-list-address-search`
- **DB 변경:** 없음 (기존 `date_spots` 조회 재사용)

## 목표

1. **핀 목록 버튼**: 데이트 지도에 등록된 핀(추억 장소) 전체를 리스트로 볼 수 있는 버튼과 목록 UI를 추가한다.
2. **주소 검색 핀 등록**: 주소/장소명 검색으로 위치를 찾아 지도 이동 후 바로 핀을 찍을 수 있게 한다.

## 요구사항

### 0. 지도 메뉴 FAB (공통 진입점) — ✅ 구현됨
- 기존 우하단 GPS 버튼을 메뉴 버튼(햄버거 아이콘)으로 교체, 터치 시 팝오버 메뉴 오픈 (`MapContainer.tsx`)
- 메뉴 항목: "현재 위치로" (기존 `locateUser`) — 이후 핀 목록·주소 검색 항목을 이 메뉴에 추가

### 1. 핀 목록 (Pin List) — ✅ 구현됨 ("추억 모아보기")
- 지도 메뉴 팝오버에 핀 목록 진입 항목 추가
- 목록 항목: 대표 사진 썸네일 · 제목 · 날짜(한국어 포맷) · 메모 1줄
- 항목 터치 시: 목록 닫기 → 해당 핀 좌표로 지도 이동(`panTo`) → 상세 시트 오픈
- 데이터는 기존 `useDateSpots`의 조회 결과를 재사용 (추가 쿼리 없음)

### 2. 주소 검색 (Address Search)
- 검색 입력 UI (지도 상단 검색바 또는 모달)
- Kakao Maps SDK `services` 라이브러리 사용 — 이미 `libraries=services`로 로드되어 있음 (`src/app/page.tsx:407`), 별도 REST 키·프록시 불필요
  - 주소 검색: `kakao.maps.services.Geocoder.addressSearch()`
  - 장소명(키워드) 검색: `kakao.maps.services.Places.keywordSearch()`
- 검색 결과 리스트에서 항목 선택 시: 해당 좌표로 지도 이동 → 기존 핀 등록 모달(`AddSpotModal`) 오픈 (도로명 주소 자동 채움 — 기존 `currentAddress` 흐름 재사용)

## 구현 범위 (예상 파일)

| 구분 | 파일 |
| --- | --- |
| 신규 | `src/components/modal/SpotListModal.tsx` (핀 목록), `src/components/map/SearchBar.tsx` 또는 `AddressSearchModal.tsx` |
| 신규 | `src/hooks/useAddressSearch.ts` (Geocoder/Places 래핑, 디바운스) |
| 수정 | `src/components/common/Header.tsx` 또는 `src/components/map/MapContainer.tsx` (진입 버튼) |
| 수정 | `src/app/page.tsx` (모달 상태·핀 이동·등록 모달 연결) |
| 수정 | `src/hooks/useKakaoMap.ts` (검색 좌표로 이동 + 등록 플로우 트리거 재사용) |

## 추가된 범위 (구현 중 확장) — ✅ 구현됨

- **데이트 기록 수정**: 상세 시트 연필 버튼 → 제목·날짜·사진(추가/삭제)·이야기 편집 모드 (`updateDateSpot`)
- **휴지통 & 복원**: 메뉴에 휴지통 항목, `deleted_date_spots` 조회·원터치 복원, 보관 30일, 고아 항목 복원 시 백업 재생성

## 완료 조건

- [x] 핀 목록 버튼 → 목록 → 항목 터치 → 지도 이동 + 상세 시트 동작
- [ ] 주소·장소명 검색 → 결과 선택 → 지도 이동 + 핀 등록 모달(주소 자동 채움) 동작
- [x] 모바일(터치) UX 확인, `npx tsc --noEmit` 통과
- [ ] `CHANGELOG.md` 갱신, `TASKS.md` 완료 표 반영 후 본 명세 삭제 (주소 검색 완료 시)
