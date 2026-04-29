import { describe, expect, it } from "vitest";

import { isPrivateHostname, isValidHttpUrl } from "./url";

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

describe("isPrivateHostname", () => {
  it.each([
    ["localhost", true],
    ["my.localhost", true],
    ["foo.local", true],
    ["127.0.0.1", true],
    ["127.1.2.3", true],
    ["10.0.0.5", true],
    ["10.255.255.255", true],
    ["172.16.0.1", true],
    ["172.31.0.1", true],
    ["192.168.1.1", true],
    ["169.254.169.254", true],
    ["0.0.0.0", true],
    ["::1", true],
    ["fe80::1", true],
    ["fc00::1", true],
    ["fd12:3456:7890::1", true],
    ["172.32.0.1", false], // outside 16-31
    ["172.15.0.1", false],
    ["192.169.1.1", false],
    ["8.8.8.8", false],
    ["example.com", false],
    ["en.wikipedia.org", false],
    ["1.1.1.1", false],
  ])("returns %s for %j", (host, expected) => {
    expect(isPrivateHostname(host)).toBe(expected);
  });
});
