import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/core/defuddle", () => ({
  extractMarkdown: vi.fn(),
}));

import { extractMarkdown } from "@/lib/core/defuddle";
import { convertUrl } from "./convert";

const mockedExtract = vi.mocked(extractMarkdown);

describe("convertUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedExtract.mockReset();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches the URL, runs extractMarkdown, and returns ConversionResult", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response("<html><body><h1>Hello</h1></body></html>", {
          status: 200,
        })
      );
    mockedExtract.mockResolvedValue({
      title: "Getting Started",
      author: "Steph Ango",
      markdown: "# Hello\n\nWorld",
    });

    const result = await convertUrl("https://example.com/post");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://example.com/post");
    expect(mockedExtract).toHaveBeenCalledTimes(1);
    expect(mockedExtract.mock.calls[0][0]).toContain("<h1>Hello</h1>");
    expect(mockedExtract.mock.calls[0][1]).toBe("https://example.com/post");

    expect(result).toEqual({
      title: "Getting Started",
      author: "Steph Ango",
      sourceUrl: "https://example.com/post",
      markdown: "# Hello\n\nWorld",
    });
  });

  it("omits author when extractMarkdown does not return one", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html></html>", { status: 200 })
    );
    mockedExtract.mockResolvedValue({
      title: "No Author Page",
      markdown: "body",
    });

    const result = await convertUrl("https://example.com/no-author");

    expect(result.author).toBeUndefined();
    expect(result.title).toBe("No Author Page");
    expect(result.sourceUrl).toBe("https://example.com/no-author");
  });

  it("throws when the upstream response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not found", { status: 404 })
    );

    await expect(convertUrl("https://example.com/missing")).rejects.toThrow();
    expect(mockedExtract).not.toHaveBeenCalled();
  });

  it("throws when fetch rejects (e.g. DNS failure)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("fetch failed")
    );

    await expect(convertUrl("https://nope.invalid")).rejects.toThrow();
  });

  it("throws when extractMarkdown rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html></html>", { status: 200 })
    );
    mockedExtract.mockRejectedValue(new Error("no content"));

    await expect(convertUrl("https://example.com")).rejects.toThrow();
  });

  it("aborts after 5000ms when the upstream fetch never resolves", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(
              Object.assign(new Error("aborted"), { name: "AbortError" })
            );
          });
        })
    );

    const promise = convertUrl("https://slow.example.com");
    const expectation = expect(promise).rejects.toThrow();

    await vi.advanceTimersByTimeAsync(5000);
    await expectation;
    expect(mockedExtract).not.toHaveBeenCalled();
  });
});
