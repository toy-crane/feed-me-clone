import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Converter } from "./Converter";

const ERROR_MESSAGE = /변환에 실패했어요/;

const successPayload = {
  title: "Hello",
  author: "Steph",
  sourceUrl: "https://example.com/post",
  markdown: "## Subsection\n\nWorld",
};

function mockFetchOk(payload: unknown) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));
}

function mockFetchFailure(status: number) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({ message: "변환에 실패했어요. 잠시 후 다시 시도해 주세요" }),
      { status }
    )
  );
}

describe("Converter — error path", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the generic error alert when /api/convert returns 502", async () => {
    const user = userEvent.setup();
    mockFetchFailure(502);

    render(<Converter />);
    await user.type(
      screen.getByRole("textbox", { name: /url/i }),
      "https://example.com{Enter}"
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(ERROR_MESSAGE);
  });

  it("keeps the URL value in the input after a failure", async () => {
    const user = userEvent.setup();
    mockFetchFailure(502);

    render(<Converter />);
    const input = screen.getByRole("textbox", { name: /url/i });
    await user.type(input, "https://example.com{Enter}");

    await screen.findByRole("alert");
    expect(input).toHaveValue("https://example.com");
  });

  it("retries the conversion when the user submits again after a failure", async () => {
    const user = userEvent.setup();
    const fetchSpy = mockFetchFailure(502);

    render(<Converter />);
    const input = screen.getByRole("textbox", { name: /url/i });
    await user.type(input, "https://example.com{Enter}");
    await screen.findByRole("alert");

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(successPayload), { status: 200 })
    );

    await user.click(screen.getByRole("button", { name: /변환/ }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Hello" })
    ).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("hides any prior error alert once a new conversion succeeds", async () => {
    const user = userEvent.setup();
    const fetchSpy = mockFetchFailure(502);

    render(<Converter />);
    const input = screen.getByRole("textbox", { name: /url/i });
    await user.type(input, "https://example.com{Enter}");
    await screen.findByRole("alert");

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(successPayload), { status: 200 })
    );
    await user.click(screen.getByRole("button", { name: /변환/ }));

    await screen.findByRole("heading", { level: 1, name: "Hello" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the error alert when fetch itself rejects (e.g. network)", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("network"));

    render(<Converter />);
    await user.type(
      screen.getByRole("textbox", { name: /url/i }),
      "https://example.com{Enter}"
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(ERROR_MESSAGE);
  });

  it("renders the result on success without an alert", async () => {
    const user = userEvent.setup();
    mockFetchOk(successPayload);

    render(<Converter />);
    await user.type(
      screen.getByRole("textbox", { name: /url/i }),
      "https://example.com/post{Enter}"
    );

    await screen.findByRole("heading", { level: 1, name: "Hello" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
