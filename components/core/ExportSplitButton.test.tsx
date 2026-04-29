import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

import { toast } from "sonner";
import { ExportSplitButton } from "./ExportSplitButton";

const mockedToast = vi.mocked(toast);
const writeText = vi.fn();

beforeEach(() => {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  mockedToast.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function flush() {
  // allow async onClick (handleCopy awaits writeText) to finish
  await Promise.resolve();
  await Promise.resolve();
}

describe("ExportSplitButton — copy", () => {
  it("copies the markdown only when prompt is empty", async () => {
    render(
      <ExportSplitButton
        markdown={"# Body\n\nLine"}
        prompt=""
        title="Hello"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "복사하기" }));
    await flush();

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("# Body\n\nLine");
  });

  it("copies prompt + blank line + body when prompt is non-empty", async () => {
    render(
      <ExportSplitButton markdown="body content" prompt="요약해줘" title="x" />
    );

    fireEvent.click(screen.getByRole("button", { name: "복사하기" }));
    await flush();

    expect(writeText).toHaveBeenCalledWith("요약해줘\n\nbody content");
  });

  it("shows the '복사됨' toast after a successful copy", async () => {
    render(<ExportSplitButton markdown="body" prompt="" title="x" />);

    fireEvent.click(screen.getByRole("button", { name: "복사하기" }));
    await flush();

    expect(mockedToast).toHaveBeenCalledTimes(1);
    expect(mockedToast.mock.calls[0][0]).toBe("복사됨");
  });
});
