# Git & Gitmoji 컨벤션 (our-date-map)

본 문서는 이 프로젝트의 커밋·브랜치·PR 작성 규칙을 정의합니다. (Vigilantis 팀 컨벤션을 `our-date-map` 단일 Next.js 앱 구조에 맞게 조정한 버전입니다.)

---

## 공통 규격: TYPE (변경 성격)

| TYPE | 용도 |
| --- | --- |
| `FEAT` | 새로운 기능 추가 |
| `FIX` | 버그 수정 |
| `REFACTOR` | 동작 변경 없는 코드 개선 |
| `CHORE` | 빌드·패키지·CI/CD·설정 등 부수 작업 |
| `DOCS` | 문서 수정(README, TASKS, CHANGELOG 등) |

- 브랜치명에서는 **소문자**(`feat`, `fix`, `refactor`, `chore`, `docs`)로 쓴다.
- 커밋·PR 제목에서는 **대문자 대괄호**(`[FEAT]` 등)로 쓴다.

---

## 브랜치 전략

| 브랜치 | 역할 |
| --- | --- |
| `main` | **배포 브랜치.** 직접 커밋하지 않고, `dev`를 머지해서만 전진한다. |
| `dev` | **기본 작업 브랜치.** 평소 작업은 `dev`에 바로 커밋·푸시한다. |
| `<type>/...` | (선택) 크거나 위험한 작업만 `dev`에서 분기해 `dev`로 머지하는 단기 브랜치. |

- **배포 흐름**: `dev` → `main` 머지. `!main` 플래그 또는 명시적인 배포 요청이 있을 때만 진행한다.
- **머지 방식**: fast-forward(`git merge --ff-only dev`)로 `main`을 `dev`에 맞춘다. `dev`를 `main`에 Squash 하지 않는다(두 브랜치 히스토리가 어긋남).
- fast-forward가 안 되면(예: `main`에 핫픽스가 먼저 들어간 경우) `main`을 `dev`에 먼저 머지·검증한 뒤 다시 시도한다.
- `main`과 `dev`는 영구 브랜치이며 삭제하지 않는다. GitHub 룰셋 `protect-main-dev`가 두 브랜치의 **삭제와 강제 푸시(force push)를 차단**한다(우회 허용 대상 없음).

---

## 브랜치명 규칙

아래 규칙은 `dev`에서 분기하는 단기 브랜치에 적용한다.

- 형식: `<type>/<이슈번호>-<english-kebab-summary>`
  - `type`: TYPE 소문자. (`feature/`는 `feat/`와 동일하게 취급하며 `feat/`를 권장)
  - `이슈번호`: GitHub 이슈 번호(숫자만, `#` 제외). 연결된 이슈가 없으면 번호를 임의로 만들지 않고 생략한다: `<type>/<english-kebab-summary>`.
  - `english-kebab-summary`: 작업을 요약하는 **영문 소문자 kebab-case**. 2~5단어 권장, 축약보다 의미 명확성 우선.
- **브랜치명에는 이모지를 넣지 않는다**(ASCII만).
- 하나의 브랜치는 하나의 이슈/작업 단위에 대응시킨다.

### 예시

| 작업 | 브랜치명 |
| --- | --- |
| 데이트 코스 공유 기능 (#21) | `feat/21-date-course-share` |
| 지도 핀 클릭 시 모달 미표시 수정 | `fix/map-pin-modal-not-opening` |
| 경로 캐싱 로직 모듈 분리 | `refactor/route-cache-module` |
| Supabase 타입 재생성 스크립트 | `chore/supabase-typegen-script` |

---

## Gitmoji (커밋·PR 제목 접두)

- 커밋과 PR **제목 맨 앞**에 변경 성격을 나타내는 gitmoji **이모지 1개**를 붙인다. (전체 목록: https://gitmoji.dev)
- **이모지 문자**(예: ✨)를 그대로 사용한다. `:sparkles:` 형태의 단축 코드는 `git log`에서 렌더링되지 않으므로 지양한다.
- TYPE을 먼저 정하고, 그 TYPE 안에서 가장 구체적으로 들어맞는 gitmoji를 고른다. 애매하면 해당 TYPE의 "대표" 이모지를 쓴다.

### TYPE별 gitmoji 매핑

| TYPE | 대표 | 세부 상황별 |
| --- | --- | --- |
| `FEAT` | ✨ | 🎉 프로젝트/모듈 시작 · 🏗️ 아키텍처 변경 · 🗃️ DB 스키마/마이그레이션(Supabase) · 🛂 인증·권한(Kakao OAuth·RLS) · 🦺 검증 로직 · 🔊 로그 추가 · 💄 UI/스타일 · 📱 반응형·PWA · 🚩 feature flag · 🏷️ 타입 정의 |
| `FIX` | 🐛 | 🚑️ 치명적 핫픽스 · 🩹 사소한 수정 · 🔒️ 보안 취약점(키 노출·스코프) · 🥅 예외/에러 처리(외부 API 폴백) · 🚨 린터 경고 · 💚 CI 빌드 수정 |
| `REFACTOR` | ♻️ | 🎨 구조/포맷 정리 · ⚡️ 성능 개선(캐싱·이미지 최적화) · 🔥 코드/파일 제거 · ⚰️ 데드코드 제거 · 🚚 이동·이름 변경 |
| `CHORE` | 🔧 | 👷 CI 빌드 시스템(`.github`) · ⬆️/⬇️ 의존성 업/다운그레이드 · ➕/➖ 의존성 추가/제거 · 📌 의존성 버전 고정 · 🔨 개발 스크립트 · 🙈 `.gitignore` · 🚀 배포(Vercel) · 🔖 릴리스 태그 |
| `DOCS` | 📝 | 💡 소스 주석 · 📄 라이선스 |

> 표에 없는 상황은 https://gitmoji.dev 에서 가장 가까운 이모지를 선택한다. TYPE(대문자 대괄호)은 gitmoji와 별개로 **항상 유지**한다.

---

## 커밋 메시지 규칙

- **제목**: `<gitmoji> [TYPE] #이슈번호 - 한 줄 설명`
  - 한 줄 설명은 한국어, 명령형/요약형으로 50자 내외. 코드 식별자·파일명은 원문 유지.
  - 연결된 이슈가 없으면 `<gitmoji> [TYPE] 한 줄 설명` 형식을 쓴다.
  - 제목 끝에 마침표(`.`)를 붙이지 않는다.
- **본문(선택, 권장)**: 제목과 한 줄 띄우고 작성. "무엇을·왜"를 불릿으로 정리한다. 어떻게(구현 상세)는 필요한 경우에만.
- **푸터(선택)**: 이슈 연결은 `Refs #이슈번호`(관련) 또는 `Closes #이슈번호`(해결)로 명시한다.
- **AI(Claude) 작성 커밋**: `Co-Authored-By` 등 AI 서명 트레일러를 **붙이지 않는다**.

### 예시

```
✨ [FEAT] #21 - 데이트 코스 공유 링크 생성 기능 구현

- GET /api/share/[id] Route Handler 추가
- date_plans의 route_summary를 공유 페이지에서 복원 렌더링
- 만료 시각(expires_at) 필드 포함

Refs #21
```

> 예: 지도 핀 모달 예외 처리 → `🥅 [FIX] 지도 핀 클릭 시 모달 미표시 예외 처리`, Supabase 마이그레이션 → `🗃️ [FEAT] date_plans 테이블 start_date/end_date 컬럼 추가`.

---

## Pull Request(PR) 규칙

- **대상 브랜치**: 단기 브랜치의 PR은 `dev`를 대상으로 한다. `main`은 `dev` 머지로만 갱신한다. (위 "브랜치 전략" 및 `CLAUDE.md` 6조 참조)
- **제목**: 커밋과 동일한 `<gitmoji> [TYPE] #이슈번호 - 한 줄 설명` 형식.
- **본문**: 아래 템플릿을 채운다.

```markdown
## 개요
<이 PR이 무엇을, 왜 바꾸는지 2~3줄>

## 변경 사항
- <핵심 변경 1>
- <핵심 변경 2>

## 테스트
- [ ] `npx tsc --noEmit` 통과
- [ ] `npm run build` 로컬 빌드 확인
- [ ] `CHANGELOG.md` / `TASKS.md` 갱신
- [ ] (DB 변경 시) `supabase/migrations/` 마이그레이션 및 `types/supabase.ts` 재생성

## 관련 이슈
Closes #<이슈번호>
```

- **Merge 방식**: 단기 브랜치를 `dev`에 병합할 때는 **`Squash and Merge`**를 권장한다. (커밋 히스토리를 단일 커밋으로 요약) `dev` → `main`은 Squash 없이 fast-forward로 머지한다.
- **머지 후 브랜치 정리**: `dev`에 머지된 단기 브랜치는 즉시 로컬(`git branch -d`)과 원격(`git push origin --delete`)에서 모두 삭제한다. 머지된 브랜치를 남겨두지 않는다.
- **AI 서명 금지**: 커밋 메시지·PR 제목·PR 본문 어디에도 `Co-Authored-By: Claude ...`, `🤖 Generated with Claude Code` 등 AI 서명을 넣지 않는다. GitHub contributor 목록에 Claude가 표시되지 않아야 한다.

---

## (선택) GitHub 이슈 제목 규칙

- 형식: `[TYPE] 한글 설명` (예: `[FEAT] 데이트 코스 공유 링크 생성`).
- 이슈의 `TYPE`이 그대로 브랜치명과 커밋·PR 제목으로 이어진다.
