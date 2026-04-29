import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/core/defuddle", () => ({
  extractMarkdown: vi.fn(),
}));

vi.mock("@/lib/core/dns-resolver", () => ({
  resolveHost: vi.fn(),
}));

import { extractMarkdown } from "@/lib/core/defuddle";
import { resolveHost } from "@/lib/core/dns-resolver";
import { convertUrl } from "./convert";

const mockedExtract = vi.mocked(extractMarkdown);
const mockedResolve = vi.mocked(resolveHost);

function htmlResponse(body: string, headers: Record<string, string> = {}) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", ...headers },
  });
}

describe("convertUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedExtract.mockReset();
    mockedResolve.mockReset();
    mockedResolve.mockResolvedValue("8.8.8.8");
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches the URL, runs extractMarkdown, and returns ConversionResult", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        htmlResponse("<html><body><h1>Hello</h1></body></html>")
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue(htmlResponse("<html></html>"));
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue(htmlResponse("<html></html>"));
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

  it("aborts after 5000ms even if extractMarkdown hangs (covers JSDOM/Defuddle phase)", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(htmlResponse("<html></html>"));
    mockedExtract.mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    const promise = convertUrl("https://hanging-parse.example.com");
    const expectation = expect(promise).rejects.toThrow(/timed out/);

    await vi.advanceTimersByTimeAsync(5000);
    await expectation;
  });

  it("rejects loopback hostnames before any fetch (SSRF defense — literal IP)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(convertUrl("http://127.0.0.1/")).rejects.toThrow(
      /private host/
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockedResolve).not.toHaveBeenCalled();
  });

  it("rejects 'localhost' before any fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(convertUrl("http://localhost:8080/x")).rejects.toThrow(
      /private host/
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects when DNS resolves the hostname into a private range (rebinding defense)", async () => {
    mockedResolve.mockResolvedValue("192.168.1.10");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(convertUrl("https://attacker.example.com/")).rejects.toThrow(
      /private host/
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects when DNS resolves to AWS metadata endpoint", async () => {
    mockedResolve.mockResolvedValue("169.254.169.254");
    await expect(convertUrl("https://attacker.example.com/")).rejects.toThrow(
      /private host/
    );
  });

  it("rejects responses larger than the size cap before invoking extractMarkdown", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("x", {
        status: 200,
        headers: {
          "content-type": "text/html",
          "content-length": String(11 * 1024 * 1024),
        },
      })
    );

    await expect(convertUrl("https://huge.example.com/")).rejects.toThrow(
      /too large/
    );
    expect(mockedExtract).not.toHaveBeenCalled();
  });

  it("rejects non-text content-types (e.g. PDF) without parsing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("%PDF-1.7…", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      })
    );

    await expect(convertUrl("https://example.com/file.pdf")).rejects.toThrow(
      /unsupported content-type/
    );
    expect(mockedExtract).not.toHaveBeenCalled();
  });
});
