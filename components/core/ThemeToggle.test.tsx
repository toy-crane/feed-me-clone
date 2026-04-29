import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme,
    resolvedTheme: "light",
    systemTheme: "light",
    themes: ["light", "dark", "system"],
  }),
}));

import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("renders an accessible toggle button", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: /다크모드 토글|테마 변경/i })
    ).toBeInTheDocument();
  });

  it("calls setTheme('dark') when current theme is light and user clicks", async () => {
    const user = userEvent.setup();
    setTheme.mockReset();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: /다크모드 토글|테마 변경/i }));

    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
