import { describe, expect, it } from "vitest";

import { isValidHttpUrl } from "./url";

describe("isValidHttpUrl", () => {
  it.each([
    ["", false],
    ["   ", false],
    ["abc", false],
    ["not a url", false],
    ["ftp://example.com", false],
    ["mailto:foo@bar.com", false],
    ["//example.com", false],
    ["https://example.com", true],
    ["http://a.b/path?q=1", true],
    ["https://example.com/path#frag", true],
    ["http://localhost:3000/foo", true],
  ])("returns %s for %j", (value, expected) => {
    expect(isValidHttpUrl(value)).toBe(expected);
  });
});
