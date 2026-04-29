# core feature — learnings

> 형식: `.claude/skills/execute-plan/references/learnings-template.md` 참조.

---
category: task-ordering
applied: not-yet
---
## Task 순서: plan.md 그대로 — 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

**상황**: Step 2, Task 의존성 분석.
**판단**: plan.md의 의존성 표가 정확함 — T1(foundation) → T2/T3(T1 위에 검증·실패 분기) → T4(T1 ResultView 슬롯) → T5(T4 prompt lift 결과 사용) → T6(T5 split 버튼 인프라) → T7(T4 prompt 보존 검증) → T8(독립). 재정렬 필요 없음.
**다시 마주칠 가능성**: 낮음 — feature별 plan이 다 다름. 굳이 일반화할 필요 없음.

---
category: spec-ambiguity
applied: not-yet
---
## defuddle 결과 매핑: `result.content` → `markdown` 필드

**상황**: T1 시작 직전, plan.md는 `lib/core/defuddle.ts`가 `{ title, author?, markdown, html }`을 반환한다고 적었지만, 실제 defuddle API는 `Defuddle(document, url, opts)`를 받고 `{ title, author, content, contentMarkdown, ... }`을 돌려준다. `markdown: true` 옵션을 켜면 `content`가 markdown 문자열이 된다.
**판단**: wrapper는 `extractMarkdown(html: string, url: string): Promise<{ title, author?, markdown }>`로 단순화. `html` 필드는 spec·시나리오에서 쓰이지 않으므로 반환에서 제외. `result.author?.trim() || undefined`로 빈 author 정규화 → Scenario 1의 "저자 줄 미표시" 분기를 wrapper에서 일관 처리.
**다시 마주칠 가능성**: 중간 — 외부 라이브러리 wrapper 시그니처를 plan에 적을 때, 라이브러리 실제 API를 확인하지 않으면 어긋날 수 있음. 다음에는 plan 단계에서 library docs를 1회 fetch.

---
category: code-review
applied: not-yet
---
## ResultView 제목(`<h1>`)이 markdown 본문의 `# Heading` 과 충돌

**상황**: T3 Converter 테스트에서 fixture markdown이 `# Hello`였는데 페이지 제목도 "Hello"여서 동일 텍스트의 h1이 2개 노출. 테스트는 fixture를 변경해 회피했지만, 실제 defuddle 출력이 `# 페이지제목`을 본문 첫 줄에 포함하면 페이지에 h1이 2개 생겨 a11y/SEO 모두 결함.
**판단**: T9(web-design-guidelines)에서 MarkdownBody에 `components={{ h1: ({node, ...p}) => <h2 {...p} /> }}` 식의 demotion 또는 remark plugin으로 모든 헤딩 1단계 강등을 적용해 회귀 차단. 지금은 회귀 위험만 남기고 진행.
**다시 마주칠 가능성**: 높음 — defuddle 출력이 페이지 제목을 본문에 포함하는 페이지가 흔함.

---
category: tooling
applied: not-yet
---
## vitest에서 `import "server-only"` 가드를 우회

**상황**: T1 service test 첫 실행에서 `server-only`가 "This module cannot be imported from a Client Component module" throw. 테스트 환경(jsdom)을 클라이언트로 인식.
**판단**: `vitest.config.ts`에 `resolve.alias["server-only"] → vitest.server-only-shim.ts`로 빈 모듈 alias. 테스트는 server-only 의도를 검증하지 않으므로 안전한 우회. 빌드/런타임에는 실제 패키지가 적용된다.
**다시 마주칠 가능성**: 중간 — Next.js 프로젝트에서 server-only 코드를 vitest로 단위 테스트할 때 같은 함정. 신규 프로젝트 셋업 시 한 번 더 같은 alias가 필요.

---
category: tooling
applied: not-yet
---
## JSX 문자열 prop의 `\n`은 escape가 아니라 백슬래시-n 리터럴

**상황**: T5 ExportSplitButton 테스트에서 `<ExportSplitButton markdown="# Body\n\nLine" />` 가 실제로는 markdown prop을 `# Body\n\nLine` (백슬래시 + n) 12자로 전달. JS string과 다름. 1차 디버깅에서 vitest 디프 출력의 escape 차이 때문에 한참 헷갈림.
**판단**: JSX에서 newline·tab 같은 escape를 쓰려면 `markdown={"# Body\n\nLine"}`로 expression brace를 써야 한다. 회피책 아닌 정정. learnings에 남겨 다음 테스트에서 다시 빠지지 않게.
**다시 마주칠 가능성**: 높음 — JSX prop 값으로 multi-line 문자열을 자주 쓰는데, 단순 `"..."` 형태에 escape를 무심코 넣기 쉬움.

---
category: tooling
applied: not-yet
---
## userEvent.setup() + 직접 조작한 navigator.clipboard 충돌

**상황**: T5 ExportSplitButton 테스트에서 `userEvent.setup()`을 쓰면서 동시에 `Object.defineProperty(navigator, "clipboard", { value: { writeText } })`를 했더니 클릭이 writeText를 호출하지 않음. user-event v14가 자체 clipboard polyfill을 설치해 mock과 충돌.
**판단**: 클립보드 mock이 필요한 테스트는 `fireEvent.click`을 쓰는 게 안전. user-event v14 `setup()`은 호출 직후 `navigator.clipboard.writeText`를 자체 polyfill로 덮어쓴다. 디버그로 `navigator.clipboard.writeText === writeText? false`를 발견. 회피책은 (a) fireEvent로 트리거, (b) userEvent.setup() 직후 clipboard mock 재주입.
**다시 마주칠 가능성**: 높음 — 클립보드를 쓰는 모든 컴포넌트 테스트.

---
category: code-review
applied: rule
---
## SSRF 방어를 fetching service의 기본 구성으로 승격

**상황**: code-reviewer가 SSRF(C1)를 Critical로 지적. 서버에서 user-supplied URL을 fetch하는 모든 service는 (a) URL 형식 검증 (b) hostname 차단 (loopback/private/link-local) (c) DNS resolve 후 IP 재검사 (rebinding 방어)의 3계층이 필요하다.
**판단**: `lib/core/url.ts`의 `isPrivateHostname` + `lib/core/dns-resolver.ts`의 `resolveHost`로 분리해 service에서 결합. **즉시 승격 candidate**: 다음 user-supplied URL을 fetch하는 feature가 등장하면 같은 패턴을 재사용해야 한다. CLAUDE.md 또는 새 `.claude/rules/server-fetch-ssrf-defense.md`로 올릴 가치가 있음.
**다시 마주칠 가능성**: 높음 — webhook ingest, OG/preview 추출, RSS 변환 등 모든 패턴.

---
category: code-review
applied: rule
---
## 외부 라이브러리 동기 파싱 단계는 AbortSignal로 중단되지 않는다

**상황**: code-reviewer C2 — `services/convert.ts`에서 `fetch(... signal)` 만으로는 `extractMarkdown`(JSDOM + Defuddle 동기 작업)이 5초 안에 끝나지 않을 수 있음. 5초 timeout invariant가 부분적으로만 강제됨.
**판단**: `Promise.race(extractMarkdown(...), abortRejection())` 패턴으로 동기 파싱 단계도 timeout으로 강제 종료. 테스트는 `mockImplementation(() => new Promise(() => {}))`로 hang 시뮬레이션 후 `vi.advanceTimersByTimeAsync(5000)`로 timer fire → reject 확인.
**다시 마주칠 가능성**: 높음 — 외부 파서/렌더러 동기 작업이 들어가는 서버 함수마다 같은 함정.

---
category: code-review
applied: rule
---
## Service에서 외부 응답 본문은 byte cap으로 읽는다

**상황**: C3 — `await response.text()`는 무제한 메모리 사용. 5초 안에 다 받아도 GB 단위 응답이면 Node 힙 폭발. JSDOM이 추가로 같은 양을 복제해 더 위험.
**판단**: `Content-Length` 사전 체크 + 스트림 ReaderWithCap (10 MB 한도). 한도 초과 시 reader.cancel() 후 throw.
**다시 마주칠 가능성**: 높음 — 외부 fetch 모든 곳에서 같은 가드가 필요.

---
category: code-review
applied: rule
---
## 새 탭 + clipboard write는 popup-blocker 안전 순서를 지킨다

**상황**: I2 — `await navigator.clipboard.writeText(...)` 뒤에 `window.open(...)`을 두면 user-gesture frame이 끊겨 Safari/strict Firefox에서 popup이 차단됨.
**판단**: `window.open(target, "_blank", "noopener,noreferrer")`을 동기 먼저 호출하고, 그 다음에 clipboard write를 await. 클립보드 실패 시 success toast 대신 error toast.
**다시 마주칠 가능성**: 중간 — LLM/외부 사이트로 핸드오프하는 패턴이 추가될 때마다.

---
category: spec-ambiguity
applied: discarded
---
## 빈 title 렌더링 fallback은 spec이 명시적으로 보류

**상황**: I4 — code-reviewer가 ResultView가 `title=""`일 때 빈 `<h1>`을 렌더한다고 지적. spec data model 주석에는 `title: string (required) — 비어 있을 수 있음(빈 문자열 그대로 전달; 다운로드 단계에서 fallback 적용)`로 명시.
**판단**: spec이 "다운로드 단계에서 fallback"을 명시했고 표시 단계에는 fallback을 요구하지 않음. `lib/core/download-md.ts`의 `buildFilename`이 이미 fallback을 적용함. ResultView에서 fallback을 추가하는 건 spec 범위 밖이므로 reject. 사용자 검수 단계에서 실 사이트로 빈 제목이 자주 발생하는지 확인 후 follow-up feature.
**다시 마주칠 가능성**: 낮음 — feature 특유 결정.


