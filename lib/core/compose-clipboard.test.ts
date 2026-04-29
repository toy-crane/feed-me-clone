import { describe, expect, it } from "vitest";

import { composeClipboardPayload } from "./compose-clipboard";

describe("composeClipboardPayload", () => {
  it("returns body unchanged when prompt is an empty string", () => {
    expect(composeClipboardPayload("", "# Body\n\nLine")).toBe(
      "# Body\n\nLine"
    );
  });

  it("returns body unchanged when prompt is whitespace-only", () => {
    expect(composeClipboardPayload("   \n\t  ", "body")).toBe("body");
  });

  it("joins prompt + body with a blank line when prompt is non-empty", () => {
    expect(composeClipboardPayload("요약해줘", "body")).toBe(
      "요약해줘\n\nbody"
    );
  });

  it("preserves newlines and structure in the body", () => {
    const body = "## H\n\n- a\n- b\n\n```js\nx\n```";
    expect(composeClipboardPayload("요약해줘", body)).toBe(
      `요약해줘\n\n${body}`
    );
  });

  it("does not trim the prompt itself when present (preserves user formatting)", () => {
    expect(composeClipboardPayload("요약해줘.\n   ", "body")).toBe(
      "요약해줘.\n   \n\nbody"
    );
  });
});
