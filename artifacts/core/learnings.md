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


