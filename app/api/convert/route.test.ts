import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/convert", () => ({
  convertUrl: vi.fn(),
}));

import { convertUrl } from "@/services/convert";
import { POST } from "./route";

const mockedConvert = vi.mocked(convertUrl);

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/convert", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/convert", () => {
  beforeEach(() => {
    mockedConvert.mockReset();
  });

  it("returns 200 + ConversionResult on success", async () => {
    mockedConvert.mockResolvedValue({
      title: "Hello",
      author: "Steph Ango",
      sourceUrl: "https://example.com/post",
      markdown: "# Hello",
    });

    const response = await POST(postRequest({ url: "https://example.com/post" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      title: "Hello",
      author: "Steph Ango",
      sourceUrl: "https://example.com/post",
      markdown: "# Hello",
    });
    expect(mockedConvert).toHaveBeenCalledWith("https://example.com/post");
  });

  it("returns 502 + generic message when convertUrl throws", async () => {
    mockedConvert.mockRejectedValue(new Error("upstream blew up"));

    const response = await POST(
      postRequest({ url: "https://example.com/missing" })
    );

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toEqual({
      message: "변환에 실패했어요. 잠시 후 다시 시도해 주세요",
    });
  });

  it("returns 400 + generic message when body has no string url", async () => {
    const response = await POST(postRequest({ url: 123 }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      message: "변환에 실패했어요. 잠시 후 다시 시도해 주세요",
    });
    expect(mockedConvert).not.toHaveBeenCalled();
  });

  it("returns 400 when url is empty", async () => {
    const response = await POST(postRequest({ url: "" }));

    expect(response.status).toBe(400);
    expect(mockedConvert).not.toHaveBeenCalled();
  });

  it("returns 400 when url has wrong scheme", async () => {
    const response = await POST(postRequest({ url: "ftp://example.com" }));

    expect(response.status).toBe(400);
    expect(mockedConvert).not.toHaveBeenCalled();
  });

  it("returns 400 when url is malformed", async () => {
    const response = await POST(postRequest({ url: "abc" }));

    expect(response.status).toBe(400);
    expect(mockedConvert).not.toHaveBeenCalled();
  });
});
