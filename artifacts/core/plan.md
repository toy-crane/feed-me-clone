# core (URL to Markdown) 구현 계획

> spec: `artifacts/core/spec.md` · wireframe: `artifacts/core/wireframe.html`

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 본문 가져오기 위치 | **Next.js Route Handler** (`POST /api/convert`, Node.js runtime) | 클라이언트 직접 fetch는 대상 도메인의 CORS로 거의 차단됨. 외부 프록시는 신뢰성·정책 의존이 추가됨. defuddle은 DOM API가 필요한데 Node에서는 jsdom 으로 충당 가능. |
| 본문 추출 라이브러리 | **defuddle** (spec 지정) | spec 의존성 항목에서 명시. |
| Markdown 렌더링 | **`react-markdown` + `remark-gfm`** | Q1: B 결정. defuddle이 반환하는 markdown 문자열을 React 트리로 렌더 → 코드블록·테이블·체크박스 등 GFM 시각 렌더가 일관되게 처리되고, 같은 markdown을 그대로 복사·다운로드에 재사용해 표현/내보내기 형식이 어긋나지 않는다. |
| 토스트 | **`sonner`** (shadcn 표준) | Q2: A 결정. shadcn 가이드에서 토스트 표준이 sonner이고, "복사됨"/"클립보드에 복사했어요…" 두 케이스만 필요하므로 추가 비용이 작다. |
| 다크모드 | **`next-themes`** (이미 설치됨) | layout.tsx에 ThemeProvider가 이미 있음. spec의 "OS 추종 + 사용자 선택은 localStorage 유지"는 `attribute="class" enableSystem` 옵션으로 그대로 충족. |
| LLM 핸드오프 URL | **ChatGPT: `https://chatgpt.com/`**, **Claude: `https://claude.ai/new`** | spec에서 plan에 확정 위임. 두 사이트 모두 새 탭 진입 시 입력창이 즉시 노출되는 공식 진입점. |
| 메타데이터(제목·저자) | **defuddle 결과의 `title`, `author` 사용** | 별도 OG/Readability 통합 없이 한 라이브러리로 일관 처리. author 미추출 시 spec 시나리오 1대로 줄 자체를 숨긴다. |
| 칩 "선택됨" 시각 표시 | **표시하지 않음** | spec 시나리오 5의 "있다면" 조항을 보수적으로 해석. 칩은 단순 단축키로 동작하고 textarea가 단일 진실. |
| 폴더 구조 | `components/core/*`, `lib/core/*`, `services/*`, `types/*`, `hooks/*` | CLAUDE.md 의존성 순서를 따른다 (types → config → lib → services → hooks → components → app). |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| `POST /api/convert` | Next.js Route Handler (Node.js runtime) | `app/api/convert/route.ts` | Task 1 |

외부 인증·DB·큐 자원은 없다. Clipboard API는 브라우저 내장이라 별도 자원 아님.

## 데이터 모델

### ConversionResult
- `title: string` (required) — defuddle이 추출한 페이지 제목. 비어 있을 수 있음(빈 문자열 그대로 전달; 다운로드 단계에서 fallback 적용).
- `author?: string` — defuddle이 추출에 실패하면 `undefined`.
- `sourceUrl: string` (required) — 사용자가 입력한 원본 URL을 그대로 echo.
- `markdown: string` (required) — defuddle의 markdown 출력. 화면 렌더링 + 복사 + 다운로드 모두 이 값을 사용.

### ConversionError
- `message: string` — 항상 `"변환에 실패했어요. 잠시 후 다시 시도해 주세요"`. 도달 불가 / 본문 추출 실패 / 5초 초과를 분기하지 않는다 (spec 시나리오 3).

### PromptState (UI 로컬, 1회용)
- `isOpen: boolean` — 펼침/접힘
- `text: string` — textarea 값
새로고침·탭 닫기 시 모두 사라진다 (spec 불변 규칙: "프롬프트는 1회용").

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| `shadcn` | T1, T4, T5, T6, T8 | Button/Input/Textarea/DropdownMenu 사용 패턴, sonner 추가, `data-icon`·`size-*` 등 critical rule, FieldGroup/Field로 입력 안내 텍스트 표현 |
| `next-best-practices` | T1, T3 | Route Handler 작성 (`route.ts`, Node runtime, error 응답), RSC 경계 — 인터랙티브 자식은 `"use client"` |
| `vercel-react-best-practices` | T1, T4, T6 | `bundle-dynamic-imports` (defuddle은 서버 전용이라 클라이언트 번들에 들어가지 않게), `rerender-derived-state` (펼침/접힘·검증 메시지) |
| `vercel-composition-patterns` | T4, T6 | `architecture-avoid-boolean-props`, compound components (PromptPanel, ExportSplitButton 내부 구조) |
| `web-design-guidelines` | T9 (final pass) | 접근성·반응형·키보드 동작 검수 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `package.json` | Modify (deps: `defuddle`, `react-markdown`, `remark-gfm`, `sonner`) | T1, T5 |
| `types/conversion.ts` | New | T1 |
| `lib/core/defuddle.ts` (서버 전용 wrapper) | New | T1 |
| `services/convert.ts` | New | T1 |
| `services/convert.test.ts` | New | T1 |
| `app/api/convert/route.ts` | New | T1 |
| `app/api/convert/route.test.ts` | New | T1 |
| `lib/core/url.ts` (URL 형식 검증) | New | T2 |
| `lib/core/url.test.ts` | New | T2 |
| `components/core/UrlInput.tsx` | New / Modify | T1, T2, T3, T7 |
| `components/core/UrlInput.test.tsx` | New / Modify | T1, T2, T3, T7 |
| `components/core/ResultView.tsx` | New | T1 |
| `components/core/ResultView.test.tsx` | New | T1 |
| `components/core/MarkdownBody.tsx` | New | T1 |
| `components/core/PromptPanel.tsx` | New | T4 |
| `components/core/PromptPanel.test.tsx` | New | T4 |
| `lib/core/compose-clipboard.ts` (프롬프트+본문 결합) | New | T5 |
| `lib/core/compose-clipboard.test.ts` | New | T5 |
| `components/core/ExportSplitButton.tsx` | New / Modify | T5, T6 |
| `components/core/ExportSplitButton.test.tsx` | New / Modify | T5, T6 |
| `lib/core/download-md.ts` (파일명 sanitize + Blob 다운로드) | New | T6 |
| `lib/core/download-md.test.ts` | New | T6 |
| `components/core/ThemeToggle.tsx` | New | T8 |
| `app/layout.tsx` | Modify (`enableSystem`, `<Toaster />` 추가) | T5, T8 |
| `app/page.tsx` | Modify (전체 화면 조립) | T1, T4, T5, T6, T8 |
| `e2e/core.spec.ts` | New | T9 |

`components/component-example.tsx`, `components/example.tsx`, 기존 `e2e/smoke.spec.ts`는 이번 feature와 무관하므로 손대지 않는다.

---

## Tasks

### Task 1: 유효 URL → 변환 결과 헤더와 Markdown 본문 렌더링 (Scenario 1 happy path)

- **담당 시나리오**: Scenario 1 (full)
- **크기**: M (~7 파일, 2 layer — service + UI)
- **의존성**: None — foundation. 가장 위험이 큰 Task(라이브러리 통합)를 앞에 두어 fail-fast.
- **참조**:
  - `next-best-practices` — route handlers, runtime selection
  - `vercel-react-best-practices` — `bundle-dynamic-imports` (defuddle은 서버 모듈 only)
  - `shadcn` — Button/Input 사용, `data-icon` 규칙
  - defuddle docs: https://defuddle.md/docs
  - react-markdown / remark-gfm 사용법 (raw URL 신뢰 가능 출처에서 패키지 README)
- **구현 대상**:
  - `package.json` — `defuddle`, `react-markdown`, `remark-gfm` 추가 (`bun add`)
  - `types/conversion.ts` — `ConversionResult`, `ConversionError`
  - `lib/core/defuddle.ts` — `extractMarkdown(html, url): { title, author?, markdown, html }` 서버 전용 wrapper. `import "server-only"` 표기.
  - `services/convert.ts` — `convertUrl(url): Promise<ConversionResult>`. 내부에서 `fetch` + `lib/core/defuddle.ts` 호출. 5초 timeout(`AbortController`).
  - `services/convert.test.ts` — defuddle은 `vi.mock`으로 묶고, `fetch`는 `globalThis.fetch`를 stub. 정상 HTML 입력 → `title`/`markdown` 매핑 검증. (외부 네트워크는 호출하지 않는다.)
  - `app/api/convert/route.ts` — `POST` 핸들러. body: `{ url: string }`. 성공: 200 + `ConversionResult`. timeout/오류: 502 + `ConversionError`. URL 형식 오류: 400 (Task 2에서 강화).
  - `app/api/convert/route.test.ts` — Route Handler를 직접 import해 `Request` 객체로 호출. `convertUrl`을 `vi.mock`으로 stub해 200/502 응답 형태를 단언.
  - `components/core/MarkdownBody.tsx` — `"use client"`. `react-markdown` + `remark-gfm`로 markdown 문자열을 렌더. shadcn Card 안에 배치(props로 markdown만 받음).
  - `components/core/ResultView.tsx` — `"use client"`. props: `ConversionResult`. 헤더(제목·저자(있을 때만)·sourceUrl) + `MarkdownBody` 렌더. split 버튼 자리는 placeholder 컨테이너만(실제 버튼은 T5에서 채움).
  - `components/core/ResultView.test.tsx` — 제목/저자 유무에 따른 렌더링 단언.
  - `components/core/UrlInput.tsx` — `"use client"`. URL `Input` + 화살표 `Button`. props: `onSubmit(url)`, `isLoading`. 로딩 중 버튼은 `disabled` + `Spinner` 표시(별도 텍스트 없음).
  - `components/core/UrlInput.test.tsx` — 화살표 클릭 / Enter 키 → `onSubmit` 호출. 로딩 중 클릭 무반응.
  - `app/page.tsx` — Server Component 컨테이너. 자식 클라이언트 컴포넌트(`UrlInput`, `ResultView`)를 결합. 변환 호출 hook은 `app/page` 안에 client wrapper 별도(또는 client 컴포넌트로 부분 위임). 헤더(앱 이름 + 다크모드 자리 placeholder)는 이 단계에서 정적 텍스트만.
- **수용 기준** (모두 spec Scenario 1 성공 기준에서 1:1):
  - [ ] 유효 URL 입력 + 화살표 버튼 클릭 → 결과 영역에 페이지 제목이 큰 헤딩(시맨틱 `<h1>` 또는 동급 typography)으로 표시된다
  - [ ] 페이지에서 저자가 추출된 경우 → 제목 아래 작은 텍스트로 저자 이름이 표시된다
  - [ ] 페이지에서 저자가 추출되지 않은 경우 → 저자 줄 자체가 DOM에 나타나지 않는다
  - [ ] 입력한 원본 URL이 헤더 영역에 항상 표시된다
  - [ ] 본문은 Markdown 문법(헤딩, 리스트, 링크, 코드 블록)이 시각적으로 렌더링된 형태로 보인다 (raw `#`/`*` 문자열이 아니라 `<h1>`/`<ul>`/`<code>`)
  - [ ] 변환 진행 중 화살표 버튼 자리에 스피너가 보이고, 다시 누를 수 없다 (별도 "변환 중..." 텍스트는 표시하지 않는다)
  - (Scenario 1 성공 기준 중 "프롬프트 영역은 결과 헤더 아래…접힌 상태"는 Task 4에서 다룬다)
- **검증**:
  - `bun run test -- services/convert components/core/UrlInput components/core/ResultView app/api/convert` — 단위·렌더 단언
  - `bun run build` — 서버/클라이언트 번들 분리 확인 (defuddle이 클라 번들에 새지 않는지)
  - Browser MCP — 로컬 dev 서버 띄우고 `https://defuddle.md/docs/getting-started` 입력 → 헤더·본문이 5초 이내 표시되는지 1회 시각 확인. 스크린샷을 `artifacts/core/evidence/task-1-happy.png`로 저장.

---

### Task 2: 잘못된 URL 형식 → 입력 단계 차단 (Scenario 2)

- **담당 시나리오**: Scenario 2 (full)
- **크기**: S (3 파일)
- **의존성**: Task 1 (UrlInput 존재)
- **참조**:
  - `shadcn` — `Field`/`FieldDescription`, `data-invalid`/`aria-invalid` 규칙
  - WHATWG URL — `new URL(value)` throw 여부로 형식 판정
- **구현 대상**:
  - `lib/core/url.ts` — `isValidHttpUrl(value: string): boolean`. `http`/`https` 스킴만 허용.
  - `lib/core/url.test.ts` — `""`, `"abc"`, `"not a url"` → false / `"https://example.com"`, `"http://a.b/path?q=1"` → true.
  - `components/core/UrlInput.tsx` — 제출 직전 `isValidHttpUrl`로 검증. 실패 시 `onSubmit` 호출하지 않고 `aria-invalid=true` + `FieldDescription`에 `"올바른 URL을 입력해 주세요"` 표시. 입력값이 변경되면 안내 문구를 비운다. 빈 문자열일 때 화살표 버튼은 `disabled`(시각적 비활성).
  - `components/core/UrlInput.test.tsx` — Scenario 2 성공 기준 4개 추가.
- **수용 기준**:
  - [ ] 빈 문자열 상태에서 화살표 버튼이 disabled로 보인다
  - [ ] `abc` 같은 비-URL 텍스트로 Enter/클릭 → `onSubmit` 호출되지 않고 `"올바른 URL을 입력해 주세요"`가 입력 필드 아래에 보인다
  - [ ] 빈 문자열로 Enter/클릭 → `onSubmit` 호출되지 않고 안내 문구가 보인다
  - [ ] 사용자가 입력 내용을 수정하면 안내 문구가 사라진다
- **검증**:
  - `bun run test -- lib/core/url components/core/UrlInput`

---

### Task 3: 변환 실패 → 일반 실패 메시지 (Scenario 3)

- **담당 시나리오**: Scenario 3 (full)
- **크기**: S (3 파일)
- **의존성**: Task 1
- **참조**:
  - `next-best-practices` — error-handling, route handler 응답 코드
  - `shadcn` — `Alert` 사용 패턴
- **구현 대상**:
  - `services/convert.ts` — `AbortController`로 5초 timeout 명시(이미 T1에서 골격은 있지만, 여기서 명확히 fail-fast 시간을 5000ms로 못박고 timeout/네트워크 실패/추출 실패를 모두 한 가지 throw로 통일).
  - `app/api/convert/route.ts` — service 예외 → 502 + `ConversionError { message: "변환에 실패했어요. 잠시 후 다시 시도해 주세요" }`. URL 형식 오류는 400 + 같은 일반 메시지(보안: 어떤 URL인지 응답에 echo하지 않음).
  - `app/page.tsx` (또는 client wrapper) — 비-OK 응답 시 `ResultView` 대신 shadcn `Alert`로 위 메시지 표시. 입력 필드의 URL 값은 그대로 유지. 버튼은 다시 활성 상태로 돌아가 재시도 가능.
  - `app/api/convert/route.test.ts` — service mock에서 throw → 502 응답 + 메시지 단언. timeout 시뮬레이션도 포함.
  - 통합 렌더 테스트(`components/core/UrlInput.test.tsx` 또는 `app` 레벨 테스트)에서 fetch를 stub해 502 응답 → Alert 메시지 표시 + 입력값 유지.
- **수용 기준**:
  - [ ] 도달 불가 URL을 보내면 `"변환에 실패했어요…"` 메시지가 표시된다
  - [ ] 본문 추출 실패도 동일한 메시지로 표시된다 (분기 없음)
  - [ ] fetch가 5000ms를 초과하면 동일한 `"변환에 실패했어요…"` 메시지가 표시된다 (불변 규칙: 성능)
  - [ ] 실패 후 입력 필드의 URL 값은 유지된다
  - [ ] 실패 후 다시 화살표 버튼을 누르면 `convertUrl` 호출이 다시 발생한다
- **검증**:
  - `bun run test -- app/api/convert services/convert components/core/UrlInput`

---

### Checkpoint A (Tasks 1-3 이후)
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] **vertical slice**: "URL 입력 → 변환 → 본문 표시 / 잘못된 URL 차단 / 실패 메시지" 세 흐름이 브라우저에서 모두 동작 (Browser MCP 1회 점검).

---

### Task 4: 프롬프트 영역 펼침·접기 + 프리셋 칩 (Scenarios 4, 5)

- **담당 시나리오**: Scenario 4 (full), Scenario 5 (full)
- **크기**: M (3 파일)
- **의존성**: Task 1 (ResultView 안에 프롬프트 영역이 들어감)
- **참조**:
  - `shadcn` — `Textarea` 직접 사용(InputGroup 없이도 OK), `Button` ghost variant, `Badge`로 칩이 아닌 `Button size="sm"` 권장 (shadcn 공식 칩 컴포넌트는 없음 → 작은 outline 버튼 = 칩)
  - `vercel-composition-patterns` — `architecture-avoid-boolean-props`, compound: `<PromptPanel>` 안에 자체 토글·textarea·칩 렌더
  - `vercel-react-best-practices` — `rerender-derived-state` (펼침/접힘은 단일 boolean state)
- **구현 대상**:
  - `components/core/PromptPanel.tsx` — `"use client"`. 자체 state로 `isOpen`/`text` 보관. 외부에는 `text`를 노출하기 위해 `value`/`onChange` 인터페이스(controlled)로 구성하고, 펼침/접힘은 내부 state. 닫힘 상태: `+ 프롬프트 추가하기 >` 버튼만. 펼침 상태: 토글 + textarea(placeholder `ex) 이 글을 요약해줘`) + 3개 칩(`요약해줘` / `한국어로 번역해줘` / `쉽게 설명해줘`). 칩 클릭 → `onChange(chipText)`로 덮어쓰기.
  - `components/core/PromptPanel.test.tsx` — Scenario 4·5의 모든 성공 기준을 1:1로 매핑.
  - `components/core/ResultView.tsx` — header와 MarkdownBody 사이에 `<PromptPanel>` 슬롯 추가. props로 `prompt`, `onPromptChange`를 위쪽 페이지에서 받도록 lift.
  - `app/page.tsx` (or client wrapper) — `prompt` state 보유 → `ResultView`에 전달.
- **수용 기준**:
  - [ ] `PromptPanel`이 결과 헤더(제목·저자·sourceUrl)와 `MarkdownBody` 사이에 렌더된다 — DOM 순서 단언 (Scenario 1 성공 기준 5번의 위치 요구사항)
  - [ ] 결과 표시 직후 프롬프트 영역은 접힌 상태(`+ 프롬프트 추가하기 >` 버튼만 보임)로 시작한다
  - [ ] 접힘에서 토글 클릭 → textarea와 프리셋 칩 3개가 화면에 나타난다 + 토글 아이콘이 `>`에서 `∨`로 바뀐다
  - [ ] 펼침에서 토글 클릭 → textarea/칩이 화면에서 사라지고 닫힘 라벨만 남는다
  - [ ] 페이지 새로고침 → 다시 접힌 상태 + textarea 빈 값으로 시작한다 (1회용 보장: localStorage·sessionStorage에 prompt를 쓰지 않는다)
  - [ ] textarea가 비어 있는 상태에서 `요약해줘` 칩 클릭 → textarea 값이 `요약해줘`가 된다
  - [ ] textarea에 `안녕`이 입력된 상태에서 `한국어로 번역해줘` 칩 클릭 → textarea 값이 정확히 `한국어로 번역해줘`이고 `안녕`이 포함되지 않는다 (이어 붙이지 않음 — `expect(value).not.toContain("안녕")` 단언)
  - [ ] 칩 클릭 후에도 칩 요소에 `active`/`selected`/`data-selected` 등 선택됨 상태를 표현하는 클래스·속성이 추가되지 않는다 (불변 규칙: 프롬프트는 단일 자유 텍스트 — 라디오 선택 상태 금지)
  - [ ] textarea를 직접 수정한 뒤에도 어떤 칩에도 선택됨 시각 표시가 없다 (Scenario 5 성공 기준 3번 — 칩 선택 표시 미구현 결정에 의해 자동 충족, 회귀 방지용 단언)
- **검증**:
  - `bun run test -- components/core/PromptPanel components/core/ResultView`
  - 1회용 보장은 코드 검색으로 보강: `grep -r "localStorage\|sessionStorage" components/core/PromptPanel*` 결과가 비어 있어야 함 (테스트 스크립트로 자동화 또는 사람이 한 번 확인).

---

### Task 5: 결과 복사 → 클립보드 + 토스트 (Scenario 6)

- **담당 시나리오**: Scenario 6 (full)
- **크기**: M (5 파일 + 의존성 추가)
- **의존성**: Task 4 (프롬프트 값이 이미 lift된 상태)
- **참조**:
  - `shadcn` — Toast via `sonner` (rules/composition.md), `<Toaster />` 한 번만 layout에 두기
  - MDN: Clipboard API (`navigator.clipboard.writeText`)
- **구현 대상**:
  - `package.json` — `sonner` 추가
  - `app/layout.tsx` — `<Toaster richColors position="top-center" />` 추가
  - `lib/core/compose-clipboard.ts` — `composeClipboardPayload(prompt: string, body: string): string`. prompt가 비어 있거나 공백만(trim) → `body` 그대로. 그 외 → `${prompt}\n\n${body}`.
  - `lib/core/compose-clipboard.test.ts` — 빈/공백/일반 prompt 3 케이스 + body 줄바꿈 보존 검증.
  - `components/core/ExportSplitButton.tsx` — `"use client"`. shadcn DropdownMenu 사용한 split 버튼. 좌측: "복사하기" (메인 동작). 우측: chevron-down으로 열리는 메뉴(이번 Task에서는 메뉴는 비워 두거나 disabled placeholder, 항목은 T6에서 채움). 좌측 클릭 → `composeClipboardPayload` 결과를 `navigator.clipboard.writeText` → `toast("복사됨")`.
  - `components/core/ExportSplitButton.test.tsx` — `navigator.clipboard.writeText` mock 후 두 케이스(프롬프트 비었을 때 / 채워졌을 때) payload 단언.
  - `components/core/ResultView.tsx` — placeholder를 `<ExportSplitButton markdown={result.markdown} prompt={prompt} />`로 교체.
- **수용 기준**:
  - [ ] 프롬프트 textarea가 비어 있는 상태에서 "복사하기" 클릭 → `navigator.clipboard.writeText`가 markdown 본문 텍스트와 정확히 일치하는 인자로 호출된다
  - [ ] 프롬프트 textarea에 `요약해줘`가 들어 있는 상태에서 "복사하기" 클릭 → 클립보드 인자의 첫 줄이 `요약해줘`이고, 한 줄 빈 행 뒤에 본문이 이어진다 (`요약해줘\n\n<body>`)
  - [ ] 클릭 직후 `"복사됨"` 토스트가 화면에 표시되고 자동으로 사라진다
- **검증**:
  - `bun run test -- lib/core/compose-clipboard components/core/ExportSplitButton`

---

### Checkpoint B (Tasks 4-5 이후)
- [ ] 모든 테스트 통과 + 빌드 성공
- [ ] **vertical slice**: "변환 → 프롬프트 펼침 → 칩으로 textarea 채움 → 복사하기 → 토스트" 흐름이 브라우저에서 동작 (Browser MCP 1회 점검, 클립보드 읽기로 페이로드 비교 또는 시각 확인).

---

### Task 6: 내보내기 메뉴 — `.md` 다운로드 + ChatGPT/Claude 열기 (Scenarios 7, 8)

- **담당 시나리오**: Scenario 7 (full), Scenario 8 (full)
- **크기**: M (4 파일)
- **의존성**: Task 5 (split 버튼·토스트 인프라)
- **참조**:
  - `shadcn` — `DropdownMenu`, `DropdownMenuItem`, `DropdownMenuGroup`. composition.md의 "Items always inside their Group" 규칙
  - 파일 다운로드: `Blob` + `URL.createObjectURL` + 임시 anchor 클릭
- **구현 대상**:
  - `lib/core/download-md.ts`:
    - `sanitizeFilename(title: string): string` — Windows/macOS 금지 문자(`/\:*?"<>|`)와 공백을 `_`로 치환. 빈 문자열·전부 치환된 결과는 `null` 반환(다음 fallback 사용 신호).
    - `fallbackFilename(now: Date): string` → `page-YYYYMMDD-HHmm` (사용자 로컬 타임존).
    - `downloadMarkdown(title: string, markdown: string): void` — 파일명 결정 → Blob 생성 → 다운로드 트리거.
  - `lib/core/download-md.test.ts` — `Hello, World!` → `Hello__World_.md` / 빈 제목 + `2026-04-29 14:30` → `page-20260429-1430.md` / Blob 텍스트가 markdown과 일치 (jsdom의 `URL.createObjectURL`은 mock 필요).
  - `components/core/ExportSplitButton.tsx` — DropdownMenu에 항목 3개 추가:
    - `마크다운 다운로드` → `downloadMarkdown(result.title, result.markdown)` (프롬프트 결합 X — 불변 규칙)
    - `ChatGPT에서 열기` → `composeClipboardPayload` → `clipboard.writeText` → `window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer")` → `toast("클립보드에 복사했어요. 입력창에 붙여넣어 주세요")`
    - `Claude에서 열기` → 같은 흐름, URL은 `https://claude.ai/new`
  - `components/core/ExportSplitButton.test.tsx` — 다운로드(Blob 텍스트 == markdown, 프롬프트 미포함 단언), ChatGPT/Claude 핸드오프 시 클립보드 payload + `window.open` 호출 인자 단언.
- **수용 기준**:
  - [ ] 페이지 제목이 `Hello, World!`라면 → `Hello__World_.md` 파일명으로 다운로드된다
  - [ ] 페이지 제목 추출 실패(빈 문자열)일 때 → `page-YYYYMMDD-HHmm.md` 파일명으로 다운로드된다
  - [ ] 다운로드된 파일 내용은 markdown과 정확히 일치하고, 프롬프트가 들어 있을 때조차 파일에 프롬프트가 포함되지 않는다 (불변 규칙 검증)
  - [ ] 프롬프트 비어 있음 + "ChatGPT에서 열기" 클릭 → `clipboard.writeText`가 markdown만으로 호출되고 `window.open`이 `https://chatgpt.com/`을 새 탭으로 연다
  - [ ] 프롬프트 비어 있음 + "Claude에서 열기" 클릭 → `https://claude.ai/new`이 새 탭으로 열린다
  - [ ] textarea에 `존댓말로 풀어줘` 있는 상태 + "ChatGPT에서 열기" → 클립보드 payload 첫 줄 `존댓말로 풀어줘`, 빈 행 뒤 본문
  - [ ] 모든 LLM 핸드오프 케이스에서 `"클립보드에 복사했어요. 붙여넣어 주세요"` 토스트가 표시된다
- **검증**:
  - `bun run test -- lib/core/download-md components/core/ExportSplitButton`

---

### Task 7: 입력 필드 X 아이콘으로 비우기 (Scenario 9)

- **담당 시나리오**: Scenario 9 (full)
- **크기**: S (2 파일)
- **의존성**: Task 4 (프롬프트 상태가 이미 lift돼 있어야 "유지" 검증 가능)
- **참조**:
  - `shadcn` — `InputGroup` + `InputGroupAddon`으로 input 안에 X 버튼을 배치(rules/forms.md). UI 라이브러리에 없으면 `relative` 컨테이너 + 절대배치 button. `components/ui/input-group.tsx`가 이미 있으므로 사용.
- **구현 대상**:
  - `components/core/UrlInput.tsx` — input 우측에 X 아이콘 버튼. `value` 비어 있으면 숨김. 클릭 → `onChange("")` (URL state만 비움). 결과 영역과 프롬프트 state는 같은 페이지의 별도 state라 자동으로 보존된다.
  - `components/core/UrlInput.test.tsx` — Scenario 9 4개 성공 기준.
- **수용 기준**:
  - [ ] 입력 필드에 값이 있을 때 X 아이콘이 보인다
  - [ ] X 아이콘 클릭 → 입력 필드 값이 빈 문자열이 된다
  - [ ] X 아이콘 클릭 후에도 결과 영역의 헤더·본문이 그대로 DOM에 남아 있다
  - [ ] X 아이콘 클릭 후에도 PromptPanel의 textarea 값과 펼침 상태가 그대로 유지된다
  - [ ] 입력 필드가 빈 문자열일 때 X 아이콘이 DOM에서 사라진다
- **검증**:
  - `bun run test -- components/core/UrlInput`

---

### Task 8: 다크모드 토글 (Scenario 10)

- **담당 시나리오**: Scenario 10 (full)
- **크기**: S (2 파일 + layout 수정)
- **의존성**: None — UI는 헤더 하나만 손대고, 다른 Task의 컴포넌트는 semantic token만 쓰므로 자동 반영.
- **참조**:
  - `next-themes` README — `useTheme`, `attribute="class"`, `enableSystem`
  - `shadcn` — `Button variant="ghost" size="icon"` + `lucide-react` `SunIcon`/`MoonIcon`
  - hydration 주의: 첫 렌더 시 서버는 OS 추종 결과를 모르므로 `mounted` 게이트로 아이콘만 클라이언트 렌더(`next-best-practices/hydration-error.md`)
- **구현 대상**:
  - `app/layout.tsx` — `ThemeProvider`의 `enableSystem={true}` + `defaultTheme="system"`. (현재 `enableSystem={false} defaultTheme="light"`라서 spec과 어긋남 → 수정)
  - `components/core/ThemeToggle.tsx` — `"use client"`. `useTheme()`로 `theme`/`setTheme` 사용. 마운트 전에는 placeholder 아이콘. 클릭 시 `theme === "dark"`면 `light`로, 아니면 `dark`로.
  - `app/page.tsx` — 헤더 우측 placeholder 자리에 `<ThemeToggle />`.
  - `e2e/core.spec.ts` (이 Task에서 신규) — Scenario 10의 "새로고침해도 마지막 선택 적용" 항목은 next-themes가 자동으로 처리하지만 contract test를 한 번 작성: 다크 클릭 → reload → `<html>` 클래스가 `dark`인지 단언.
- **수용 기준**:
  - [ ] 첫 방문(localStorage 비어 있음, OS 라이트 모드 가정) → `<html>`에 `dark` 클래스가 없고 라이트 색상으로 보인다
  - [ ] 토글 클릭 → 페이지 전체 색상이 즉시 반대 테마로 바뀐다 (`<html class>`가 `dark` ↔ `(none)`)
  - [ ] 다크 모드로 둔 채 페이지 새로고침 → 다크 모드가 그대로 유지된다 (e2e로 검증)
- **검증**:
  - `bun run test -- components/core/ThemeToggle`
  - `bun run test:e2e -- core` — reload 시 테마 유지 (Playwright는 localStorage가 자동 보존)

---

### Checkpoint C (Tasks 6-8 이후, 최종)
- [ ] 모든 테스트 통과: `bun run test`
- [ ] e2e 통과: `bun run test:e2e`
- [ ] 빌드 성공: `bun run build`
- [ ] **vertical slice**: spec의 모든 시나리오(1-10)가 브라우저에서 동작 (Browser MCP 1회 종합 점검).

---

### Task 9: 반응형·접근성 종합 검수 (불변 규칙: 반응형, 일반 접근성)

- **담당 시나리오**: 모든 시나리오 (cross-cutting). spec 불변 규칙 "반응형"·"성능" 마감.
- **크기**: S (수정만, 새 파일 거의 없음)
- **의존성**: Task 8 완료 후
- **참조**:
  - `web-design-guidelines` — 가이드라인 fetch + 본 feature 컴포넌트들에 적용
  - `shadcn` — rules/styling.md
- **구현 대상**:
  - `components/core/*` — 가이드라인 위반 사항 수정 (truncate, gap-* vs space-*, semantic token, focus ring 등)
  - 모바일(375px)·데스크톱(≥1024px) 두 viewport에서 split 버튼·드롭다운·프롬프트 영역이 화면을 벗어나지 않는지 점검 (필요 시 `flex-wrap`, `min-w-0`, `truncate` 보정)
  - 키보드 흐름: Tab 순서가 입력 → 화살표 → 헤더 → 복사 → 메뉴 → 프롬프트 토글 → textarea → 칩 → 본문 순으로 자연스러운지 한 번 확인
- **수용 기준**:
  - [ ] 모바일 375px에서 split 버튼·메뉴·X 아이콘이 잘리거나 화면을 벗어나지 않는다 (Browser MCP에서 viewport 변경 후 시각 확인)
  - [ ] 데스크톱 ≥1024px에서도 동일하게 동작한다
  - [ ] `web-design-guidelines` 점검에서 차단성(blocker) 위반 없음 (warning은 별도 follow-up 항목으로 기록)
- **검증**:
  - `web-design-guidelines` 스킬 실행 — 결과 텍스트를 `artifacts/core/evidence/task-9-guidelines.txt`에 저장
  - Browser MCP — 두 viewport 스크린샷을 `artifacts/core/evidence/task-9-mobile.png`, `task-9-desktop.png`로 저장
  - Human review (사용자) — 디자인 마감 한 번 확인. 합격 기준: 모바일/데스크톱 모두에서 모든 시나리오가 손에 잡히게 동작.

---

## 미결정 항목

(현재 시점 없음 — 모든 결정이 위 표에 명시됨. 구현 중 발견되는 결정은 plan에 다시 반영한다.)
