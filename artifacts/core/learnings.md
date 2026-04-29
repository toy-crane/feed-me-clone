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
