import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PromptPanel, PROMPT_PRESETS } from "./PromptPanel";

const TOGGLE_LABEL = /프롬프트 추가하기/;

function setup(initial = "") {
  const onChange = vi.fn();
  const utils = render(
    <PromptPanel value={initial} onChange={onChange} />
  );
  return { onChange, ...utils };
}

describe("PromptPanel", () => {
  it("starts collapsed: only the toggle is visible", () => {
    setup();
    expect(
      screen.getByRole("button", { name: TOGGLE_LABEL })
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    PROMPT_PRESETS.forEach((preset) => {
      expect(
        screen.queryByRole("button", { name: preset })
      ).not.toBeInTheDocument();
    });
  });

  it("expands the textarea + 3 preset chips when the toggle is clicked", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: TOGGLE_LABEL }));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ex) 이 글을 요약해줘")).toBeInTheDocument();
    PROMPT_PRESETS.forEach((preset) => {
      expect(
        screen.getByRole("button", { name: preset })
      ).toBeInTheDocument();
    });
  });

  it("collapses again on a second toggle click — textarea and chips disappear", async () => {
    const user = userEvent.setup();
    setup();

    const toggle = screen.getByRole("button", { name: TOGGLE_LABEL });
    await user.click(toggle);
    await user.click(toggle);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    PROMPT_PRESETS.forEach((preset) => {
      expect(
        screen.queryByRole("button", { name: preset })
      ).not.toBeInTheDocument();
    });
  });

  it("calls onChange with the chip text when an empty textarea + chip is clicked", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("");

    await user.click(screen.getByRole("button", { name: TOGGLE_LABEL }));
    await user.click(screen.getByRole("button", { name: "요약해줘" }));

    expect(onChange).toHaveBeenLastCalledWith("요약해줘");
  });

  it("OVERWRITES textarea content with the chip text — does NOT append to existing", async () => {
    const user = userEvent.setup();
    const { onChange } = setup("안녕");

    await user.click(screen.getByRole("button", { name: TOGGLE_LABEL }));
    await user.click(screen.getByRole("button", { name: "한국어로 번역해줘" }));

    expect(onChange).toHaveBeenLastCalledWith("한국어로 번역해줘");
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(last).not.toContain("안녕");
  });

  it("does NOT mark any chip as 'selected' after clicking it (no active state)", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: TOGGLE_LABEL }));
    const chip = screen.getByRole("button", { name: "요약해줘" });
    await user.click(chip);

    expect(chip).not.toHaveAttribute("aria-pressed", "true");
    expect(chip).not.toHaveAttribute("data-selected");
    expect(chip).not.toHaveAttribute("data-state", "active");
    expect(chip).not.toHaveClass("active");
    expect(chip).not.toHaveClass("selected");
  });

  it("does NOT mark any chip as selected even after editing the textarea directly", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: TOGGLE_LABEL }));
    await user.type(screen.getByRole("textbox"), "요약해줘");

    PROMPT_PRESETS.forEach((preset) => {
      const chip = screen.getByRole("button", { name: preset });
      expect(chip).not.toHaveAttribute("aria-pressed", "true");
      expect(chip).not.toHaveAttribute("data-selected");
    });
  });

  it("does not write prompt text or open state to localStorage / sessionStorage", async () => {
    const user = userEvent.setup();
    const lsSet = vi.spyOn(Storage.prototype, "setItem");

    setup();
    await user.click(screen.getByRole("button", { name: TOGGLE_LABEL }));
    await user.type(screen.getByRole("textbox"), "ephemeral");

    expect(
      lsSet.mock.calls.some(
        ([key, val]) =>
          (typeof key === "string" && key.toLowerCase().includes("prompt")) ||
          (typeof val === "string" && val.includes("ephemeral"))
      )
    ).toBe(false);

    lsSet.mockRestore();
  });
});
