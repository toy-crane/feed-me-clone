import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildFilename,
  downloadMarkdown,
  fallbackFilename,
  sanitizeFilename,
} from "./download-md";

describe("sanitizeFilename", () => {
  it("replaces spaces and reserved chars with underscores", () => {
    expect(sanitizeFilename("Hello, World!")).toBe("Hello__World_");
  });

  it("strips path separators and reserved characters across both OS conventions", () => {
    expect(sanitizeFilename(`a/b\\c:d*e?f"g<h>i|j`)).toBe(
      "a_b_c_d_e_f_g_h_i_j"
    );
  });

  it("returns null for an empty title", () => {
    expect(sanitizeFilename("")).toBeNull();
  });

  it("returns null for a whitespace-only title", () => {
    expect(sanitizeFilename("   ")).toBeNull();
  });

  it("returns null when every character was reserved (collapses to underscores only)", () => {
    expect(sanitizeFilename("///")).toBeNull();
  });
});

describe("fallbackFilename", () => {
  it("formats a Date in local timezone as page-YYYYMMDD-HHmm", () => {
    const fixed = new Date(2026, 3, 29, 14, 30, 0); // April 29, 2026, 14:30 local
    expect(fallbackFilename(fixed)).toBe("page-20260429-1430");
  });

  it("zero-pads month, day, hour, minute under 10", () => {
    const fixed = new Date(2026, 0, 5, 3, 7, 0); // January 5, 2026, 03:07
    expect(fallbackFilename(fixed)).toBe("page-20260105-0307");
  });
});

describe("buildFilename", () => {
  it("uses the sanitized title when present", () => {
    expect(buildFilename("Hello, World!", new Date(2026, 3, 29, 14, 30))).toBe(
      "Hello__World_"
    );
  });

  it("falls back to the timestamp when the title is empty", () => {
    expect(buildFilename("", new Date(2026, 3, 29, 14, 30))).toBe(
      "page-20260429-1430"
    );
  });
});

describe("downloadMarkdown", () => {
  let createdAnchors: HTMLAnchorElement[];
  let createdUrls: string[];
  let revokedUrls: string[];
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    createdAnchors = [];
    createdUrls = [];
    revokedUrls = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      const url = `blob:${createdUrls.length}`;
      (blob as Blob & { __url__: string }).__url__ = url;
      createdUrls.push(url);
      return url;
    }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn((url: string) => {
      revokedUrls.push(url);
    });
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        const anchor = el as HTMLAnchorElement;
        anchor.click = vi.fn();
        createdAnchors.push(anchor);
      }
      return el;
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it("creates a Blob containing exactly the markdown text and triggers an anchor click", async () => {
    const captured: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      captured.push(blob);
      return "blob:1";
    }) as typeof URL.createObjectURL;

    downloadMarkdown(
      "Hello, World!",
      "# Body\n\nLine",
      new Date(2026, 3, 29, 14, 30)
    );

    expect(createdAnchors).toHaveLength(1);
    const anchor = createdAnchors[0];
    expect(anchor.download).toBe("Hello__World_.md");
    expect(anchor.click).toHaveBeenCalledTimes(1);

    expect(captured).toHaveLength(1);
    const blob = captured[0];
    expect(blob.type).toContain("text/markdown");
    const text = await blob.text();
    expect(text).toBe("# Body\n\nLine");
  });

  it("uses the timestamp fallback for an empty title", () => {
    downloadMarkdown("", "body", new Date(2026, 3, 29, 14, 30));
    expect(createdAnchors[0].download).toBe("page-20260429-1430.md");
  });

  it("does NOT prepend the prompt text — markdown only", async () => {
    const captured: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      captured.push(blob);
      return "blob:2";
    }) as typeof URL.createObjectURL;

    // The signature does not accept prompt — proving the file cannot include it.
    downloadMarkdown("X", "BODY-ONLY", new Date(2026, 3, 29, 14, 30));

    const text = await captured[0].text();
    expect(text).toBe("BODY-ONLY");
    expect(text).not.toContain("프롬프트");
  });
});
