# 🛠️ Git 커밋 및 브랜치 컨벤션 가이드 (Git & Gitmoji Conventions)

본 문서는 프로젝트의 코드 이력 관리와 원활한 협업을 위한 **업계 표준 Git 커밋 및 브랜치 전략 컨벤션**을 정의합니다.

---

## 1. 📝 커밋 메시지 구조 (Commit Message Structure)

기본적인 커밋 메시지 구조는 **Conventional Commits**와 **Gitmoji** 표준을 조합하여 사용합니다.

```text
<emoji> <type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### 예시 (Examples)
* `✨ feat(auth): 소셜 로그인(Google) 기능 구현`
* `🐛 fix(map): 지도 핀 클릭 시 모달 안 뜨는 현상 수정`
* `♻️ refactor(ui): Button 공통 컴포넌트 구조 개선`
* `📝 docs: git 커밋 컨벤션 문서(conventions.md) 작성`
* `🔧 chore: TailwindCSS 및 PostCSS 관련 패키지 업데이트`

---

## 2. 🏷️ 커밋 타입 (Commit Types)

| 커밋 타입 | 설명 |
| :--- | :--- |
| **`feat`** | 새로운 기능 추가 |
| **`fix`** | 버그 수정 |
| **`docs`** | 문서 작성 및 수정 (`README.md`, 주석 등) |
| **`style`** | 코드 의미에 영향을 주지 않는 변경 (포맷팅, 세미콜론 누락 등) |
| **`refactor`** | 리팩토링 (기능 변경 없이 코드 구조 개선) |
| **`perf`** | 성능 향상 (Performance improvement) |
| **`test`** | 테스트 코드 추가, 수정, 리팩토링 |
| **`build`** | 빌드 시스템 또는 외부 의존성 관련 변경 (`npm`, `webpack` 등) |
| **`ci`** | CI/CD 설정 파일 및 스크립트 수정 (`GitHub Actions` 등) |
| **`chore`** | 패키지 매니저 설정, 기타 자잘한 작업 (소스 코드 수정 없음) |
| **`revert`** | 이전 커밋 되돌리기 |

---

## 3. 🎨 Gitmoji 체크리스트 (Gitmoji Cheatsheet)

현업에서 가장 자주 사용되는 주요 이모지 모음입니다.

| 이모지 | 태그 코드 | 주요 용도 | 예시 |
| :---: | :--- | :--- | :--- |
| ✨ | `:sparkles:` | 새로운 기능 구현 | `✨ feat: 회원가입 기능 개발` |
| 🐛 | `:bug:` | 버그 수정 | `🐛 fix: 결제 에러 수정` |
| 🚑️ | `:ambulance:` | 치명적인 긴급 버그 수정 (Hotfix) | `🚑️ hotfix: 서버 다운 원인 패치` |
| 💄 | `:lipstick:` | UI/UX 스타일링 작업 | `💄 style: 메인 헤더 디자인 개편` |
| ♻️ | `:recycle:` | 코드 리팩토링 | `♻️ refactor: API 요청 로직 모듈화` |
| ⚡️ | `:zap:` | 성능 개선 | `⚡️ perf: 이미지 로딩 속도 최적화` |
| 📝 | `:memo:` | 문서 추가/수정 | `📝 docs: API 명세서 업데이트` |
| 🔒️ | `:lock:` | 보안 관련 이슈 해결 | `🔒️ fix: 토큰 검증 로직 강화` |
| 🚀 | `:rocket:` | 배포 관련 작업 | `🚀 chore: v1.0.0 프로덕션 배포` |
| 🧪 | `:test_tube:` | 실패하는 테스트 작성 또는 실험성 코드 | `🧪 test: 단위 테스트 추가` |
| ✅ | `:white_check_mark:` | 테스트 성공 및 통과 | `✅ test: 회원가입 테스트 통과` |
| 📦️ | `:package:` | 패키지/의존성 추가 및 업데이트 | `📦️ chore: axios 패키지 추가` |
| 🚚 | `:truck:` | 파일 이동 또는 이름 변경 | `🚚 refactor: utils 폴더 위치 이동` |
| 🔥 | `:fire:` | 불필요한 코드나 파일 삭제 | `🔥 chore: 사용하지 않는 디렉토리 제거` |
| 🔧 | `:wrench:` | 개발 설정 파일 작성/수정 | `🔧 chore: tsconfig.json 설정 변경` |
| 🚧 | `:construction:` | 진행 중인 작업 (Work In Progress) | `🚧 feat: 장바구니 기능 작업 중` |

---

## 4. ✍️ 커밋 작성 세부 규칙 (Commit Rules)

1. **제목(Subject)은 50자 이내**로 명확하고 간결하게 작성합니다.
2. **제목 끝에 마침표(`.`)를 붙이지 않습니다.**
3. **명령조 또는 명사형 통일**:
   - 좋은 예: `✨ feat: 로그인 기능 추가` 또는 `✨ feat: Add login feature`
   - 나쁜 예: `✨ feat: 로그인 기능을 추가했습니다.`
4. **본문(Body)** 이 필요한 경우, 제목과 본문 사이에 **빈 줄**을 하나 둡니다. (무엇을, 왜 변경했는지 서술)
5. **이슈 번호 참조(Footer)**: 커밋이 특정 이슈와 관련이 있는 경우 하단에 언급합니다.
   - 예: `Fixes: #12` 또는 `Closes: #45`

---

## 5. 🌿 브랜치 전략 (Git Branching Strategy)

업계에서 가장 널리 쓰이는 **GitHub Flow / Simplified Git Flow** 표준을 채택합니다.

### 메인 브랜치
* **`main` (또는 `master`)**: 프로덕션에 배포 가능한 상태의 최신 코드 브랜치.
* **`develop`** (선택 사항): 기능들이 모여 다음 배포를 준비하는 개발 브랜치.

### 보조 브랜치 (Feature / Issue Branches)
브랜치 이름은 `<type>/<issue-number>-<short-description>` 형식으로 작성합니다.

| 브랜치 접두사 | 설명 | 예시 |
| :--- | :--- | :--- |
| **`feature/`** 또는 **`feat/`** | 새로운 기능 개발 | `feature/#12-google-login` |
| **`fix/`** 또는 **`bugfix/`** | 일반 버그 수정 | `fix/#34-map-render-error` |
| **`hotfix/`** | 운영 환경 긴급 버그 수정 | `hotfix/#99-auth-token-leak` |
| **`refactor/`** | 리팩토링 전용 작업 | `refactor/#45-state-management` |
| **`docs/`** | 문서화 전용 작업 | `docs/#2-update-readme` |

---

## 6. 🔀 Pull Request (PR) & Code Review

1. **PR 제목 양식**:
   - `[FE] ✨ feat(#12): 소셜 로그인 기능 구현`
2. **PR 본문 포함 내용**:
   - **작업 개요 (Summary)**: 무엇을 변경했는지 요약
   - **관련 이슈 (Related Issues)**: `Closes #12`
   - **체크리스트**: 테스트 통과 여부, 셀프 리뷰 진행 여부
3. **Merge 방식**:
   - 일반적인 기능 개발 브랜치 합병 시 **`Squash and Merge`**를 권장합니다. (커밋 히스토리를 깔끔하게 단일 커밋으로 요약)
