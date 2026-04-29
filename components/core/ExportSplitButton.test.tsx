import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/core/download-md", () => ({
  downloadMarkdown: vi.fn(),
}));

import { toast } from "sonner";
import { downloadMarkdown } from "@/lib/core/download-md";
import { ExportSplitButton } from "./ExportSplitButton";

const mockedToast = vi.mocked(toast);
const mockedDownload = vi.mocked(downloadMarkdown);
const writeText = vi.fn();
const windowOpen = vi.fn();

const originalOpen = window.open;

beforeEach(() => {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  mockedToast.mockReset();
  mockedDownload.mockReset();
  windowOpen.mockReset();
  window.open = windowOpen as unknown as typeof window.open;
});

afterEach(() => {
  window.open = originalOpen;
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

async function openMenu() {
  // Radix DropdownMenu opens on pointerdown / keydown for the trigger.
  // Use the keyboard event ('Enter' or 'ArrowDown') to open without going
  // through userEvent.setup() (which clobbers navigator.clipboard).
  const trigger = screen.getByRole("button", { name: /더 많은 내보내기/ });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });
  // Re-install clipboard mock in case anything tampered with it.
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  return within(await screen.findByRole("menu"));
}

describe("ExportSplitButton — export menu", () => {
  it("downloads markdown only (does not include the prompt) when '마크다운 다운로드' is clicked", async () => {
    render(
      <ExportSplitButton
        markdown="BODY"
        prompt="이 글을 요약해줘"
        title="Hello, World!"
      />
    );

    const menu = await openMenu();
    fireEvent.click(menu.getByRole("menuitem", { name: "마크다운 다운로드" }));
    await flush();

    expect(mockedDownload).toHaveBeenCalledTimes(1);
    expect(mockedDownload).toHaveBeenCalledWith("Hello, World!", "BODY");
  });

  it("opens ChatGPT in a new tab and copies markdown only when prompt is empty", async () => {
    render(<ExportSplitButton markdown="BODY" prompt="" title="x" />);

    const menu = await openMenu();
    fireEvent.click(menu.getByRole("menuitem", { name: "ChatGPT에서 열기" }));
    await flush();

    expect(writeText).toHaveBeenCalledWith("BODY");
    expect(windowOpen).toHaveBeenCalledTimes(1);
    expect(windowOpen.mock.calls[0][0]).toBe("https://chatgpt.com/");
    expect(windowOpen.mock.calls[0][1]).toBe("_blank");
    expect(windowOpen.mock.calls[0][2]).toBe("noopener,noreferrer");
  });

  it("opens Claude in a new tab and copies markdown only when prompt is empty", async () => {
    render(<ExportSplitButton markdown="BODY" prompt="" title="x" />);

    const menu = await openMenu();
    fireEvent.click(menu.getByRole("menuitem", { name: "Claude에서 열기" }));
    await flush();

    expect(writeText).toHaveBeenCalledWith("BODY");
    expect(windowOpen.mock.calls[0][0]).toBe("https://claude.ai/new");
  });

  it("includes the prompt + body when prompt is filled and ChatGPT menu is clicked", async () => {
    render(
      <ExportSplitButton markdown="BODY" prompt="존댓말로 풀어줘" title="x" />
    );

    const menu = await openMenu();
    fireEvent.click(menu.getByRole("menuitem", { name: "ChatGPT에서 열기" }));
    await flush();

    expect(writeText).toHaveBeenCalledWith("존댓말로 풀어줘\n\nBODY");
  });

  it("shows the LLM-handoff toast on every LLM menu click", async () => {
    render(<ExportSplitButton markdown="BODY" prompt="" title="x" />);

    let menu = await openMenu();
    fireEvent.click(menu.getByRole("menuitem", { name: "ChatGPT에서 열기" }));
    await flush();
    expect(mockedToast.mock.calls.at(-1)?.[0]).toMatch(
      /클립보드에 복사했어요/
    );
    expect(mockedToast.mock.calls.at(-1)?.[0]).toMatch(/붙여넣어 주세요/);

    mockedToast.mockClear();

    menu = await openMenu();
    fireEvent.click(menu.getByRole("menuitem", { name: "Claude에서 열기" }));
    await flush();
    expect(mockedToast.mock.calls.at(-1)?.[0]).toMatch(
      /클립보드에 복사했어요/
    );
  });
});
