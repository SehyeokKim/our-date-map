# 💕 Our Date Map — 우리들의 데이트 지도

> 커플이 함께 쓰는 **데이트 기록 · 계획 PWA**.
> 지도 위에 추억을 핀으로 남기고, 다음 데이트 코스를 짜고, 팝캣 버튼으로 서로에게 푸시 알림을 보냅니다.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Standalone-5A0FC8?logo=pwa&logoColor=white)

<!-- TODO: 스크린샷/데모 GIF 추가
| 추억 지도 | 코스 플래닝 | 팝캣 푸시 |
| --- | --- | --- |
| <img src="docs/screenshots/map.png" width="240"/> | <img src="docs/screenshots/plan.png" width="240"/> | <img src="docs/screenshots/popcat.png" width="240"/> |
-->

---

## ✨ 주요 기능

### 🗺️ 추억 데이트 지도
- 지도 임의 위치 터치로 데이트 장소 핀 등록 (하트 커스텀 마커)
- 장소당 **사진 최대 10장** 업로드 — 업로드 전 클라이언트에서 **300KB 이하로 자동 압축**
- 2단계 상세 보기: 요약 팝업(대표 사진·한 줄 메모) → 전체 시트(사진 캐러셀·메모 전문)
- 실시간 GPS 추적 & 펄싱 위치 마커, 원터치 내 위치 포커싱
- 핀 삭제 시 하드 삭제 대신 **휴지통 테이블로 소프트 삭제 + 복원** 지원

### 📅 미래 데이트 코스 플래닝
- 날짜/기간을 정해 방문 순서대로 코스 핀 구성, DB 영구 저장 및 원터치 복원
- **Kakao Mobility API** 기반 경유지 경로(Polyline) · 거리 · 소요시간 시각화
- **ODsay API** 기반 핀 구간별 대중교통 카드(⏱️ 소요시간 · 🚉 노선), 단거리는 도보 안내로 자동 폴백
- 과거/미래 탭으로 나뉜 데이트 일정 목록에서 "지도에서 코스 보기" 시 전체 코스가 화면에 맞게 카메라 자동 바운딩

### 🐱 커플 인터랙션 (Web Push)
- 지도 위 **팝캣(Popcat) 버튼**을 누르면 상대방 기기로 즉시 푸시 알림 발송 (입 벌리는 애니메이션 + 쿨다운)
- 더블클릭으로 알림 문구 커스텀(퀵 프리셋 지원), 파트너 지정 타겟 발송
- 서비스 워커 백그라운드 수신, 발송 이력 DB 기록

### 👤 인증 & 프로필
- **Kakao OAuth** 3초 로그인 (Supabase Auth + `@supabase/ssr`)
- 닉네임/프로필 사진 수정 모달, 회원가입 시 프로필 자동 생성(DB 트리거)
- 핀마다 작성자 추적 — `(내 기록)` 배지 표시

---

## 🛠️ 기술 스택

| 분류 | 기술 |
| --- | --- |
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Lucide React |
| Backend / DB | Supabase (PostgreSQL · Auth · Storage · RLS) · Next.js Route Handlers |
| 지도 · 경로 | Kakao Maps JavaScript SDK · Kakao Mobility Directions API · ODsay 대중교통 API |
| PWA / Push | Web App Manifest (standalone) · Service Worker · Web Push (VAPID) |
| 유틸리티 | browser-image-compression (클라이언트 이미지 압축) |

---

## 🏗️ 아키텍처 & 엔지니어링 포인트

### 1. API 키 보호 프록시 패턴
외부 REST API(Kakao Mobility, ODsay)는 클라이언트에서 직접 호출하지 않고 **Next.js Route Handler를 프록시로 경유**합니다. 비밀 키는 서버 환경변수로만 접근해 클라이언트 번들에 노출되지 않습니다.

```
Client → /api/directions → Kakao Mobility API   (KAKAO_REST_API_KEY, 서버 전용)
Client → /api/transit    → ODsay API            (ODSAY_API_KEY, 서버 전용)
Client → /api/push/send  → Web Push 발송         (VAPID_PRIVATE_KEY, 서버 전용)
```

### 2. API 쿼터 보호 다층 캐싱
ODsay 일 1,000회 등 외부 API 쿼터를 보호하기 위해 경로 데이터를 3단계로 캐싱합니다.

1. **인메모리 캐시** — 동일 구간(좌표 키) 중복 호출 방지 (`useTransitRoute`)
2. **localStorage** — 새로고침 간 플랜/경로 보존
3. **DB 영구 저장** — 계산된 경로 전체(`path` Polyline 좌표, 구간별 대중교통 정보)를 `date_plans.route_summary`(JSONB)에 저장, 코스 불러오기 시 API 재호출 없이 즉시 복원 렌더링. 장소 추가/삭제/순서 변경 시에만 재탐색

### 3. 데이터 무결성 설계
- **소프트 삭제**: 핀 삭제 시 원본을 `deleted_date_spots`에 JSONB로 아카이빙 후 `deleted_at` 마킹 — **DB 트리거**가 동기화를 보장하고, 복원 API 제공
- **정규화**: 작성자 메타데이터를 `date_spots`의 하드코딩 컬럼에서 `public.profiles` 테이블로 분리, FK 기반 관계형 JOIN(`select('*, profiles(...)')`)으로 조회
- **RLS**: 전 테이블 Row Level Security 정책 적용, 마이그레이션 17개로 스키마 이력 관리

### 4. 모바일 퍼스트 PWA
- `display: standalone` 매니페스트 + 풀스크린 무스크롤 지도 레이아웃으로 네이티브 앱 수준의 UX
- 서비스 워커가 백그라운드 푸시 수신·클릭 포커싱 처리
- 핀치 줌 방지, 터치 제스처(더블클릭·롱프레스), 햅틱 피드백 등 모바일 인터랙션 디테일

---

## 🗄️ 데이터베이스 구성

| 테이블 | 역할 |
| --- | --- |
| `date_spots` | 데이트 장소 핀 (사진 배열, 메모, 좌표, 작성자 FK, 소프트 삭제) |
| `deleted_date_spots` | 삭제 핀 휴지통 (원본 JSONB 아카이브, 트리거 동기화) |
| `date_plans` | 미래 데이트 플랜 (기간, 코스 핀 목록, `route_summary` JSONB 경로 캐시) |
| `profiles` | 사용자 프로필 (닉네임, 아바타, 파트너 지정 `partner_id`) |
| `push_subscriptions` | 기기별 Web Push 구독 정보 |
| `push_messages` | 푸시 발송 이력 (발신/수신자, 제목/본문, 발송 시각) |

Storage 버킷: `date-photos`(추억 사진), `avatars`(프로필 사진)

---

## 📂 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── directions/route.ts   # Kakao Mobility 경유지 경로 프록시
│   │   ├── transit/route.ts      # ODsay 대중교통 경로 프록시
│   │   └── push/send/route.ts    # Web Push 발송 + 이력 기록
│   ├── auth/callback/route.ts    # Kakao OAuth 콜백 (세션 교환)
│   └── page.tsx                  # 메인 지도 화면
├── components/
│   ├── common/                   # Header, Toast
│   ├── map/                      # MapContainer
│   └── modal/                    # 스팟/플랜/프로필/푸시 모달 & 바텀 시트
├── hooks/                        # useKakaoMap, useDateSpots, useFuturePlanner,
│                                 # useTransitRoute, useWebPush, useAuth ...
├── lib/                          # supabase 클라이언트, 이미지 압축 업로드
└── types/                        # 도메인 타입 (spot, planner, transit, supabase)
supabase/
├── migrations/                   # 스키마 마이그레이션 17개
└── schema.sql                    # 통합 참조 스키마
public/
├── manifest.json                 # PWA 매니페스트 (standalone)
└── sw.js                         # 서비스 워커 (백그라운드 푸시)
```

---

## 🚀 시작하기

### 1. 환경변수 설정

`.env.local` 파일을 생성합니다.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<Supabase 프로젝트 URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon key>

# Kakao (클라이언트: 지도 SDK / 서버 전용: Mobility REST)
NEXT_PUBLIC_KAKAO_MAP_KEY=<Kakao JavaScript 키>
KAKAO_REST_API_KEY=<Kakao REST API 키>

# ODsay 대중교통 (서버 전용)
ODSAY_API_KEY=<ODsay API 키>

# Web Push VAPID (npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<VAPID public key>
VAPID_PRIVATE_KEY=<VAPID private key>
VAPID_SUBJECT=mailto:<연락 이메일>
```

### 2. 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

### 3. 데이터베이스 (Supabase CLI)

```bash
npx supabase db push                                          # 마이그레이션 적용
npx supabase gen types typescript --linked > src/types/supabase.ts   # 타입 생성
```

---

## 📚 문서

- [CHANGELOG.md](CHANGELOG.md) — 버전별 변경 이력 (Keep a Changelog / SemVer)
- [TASKS.md](TASKS.md) — 작업 현황 인덱스
- [docs/conventions.md](docs/conventions.md) — Git 커밋 · 브랜치 · PR 컨벤션 (Gitmoji)
