import { expect, test } from "@playwright/test";

test.describe("core — dark mode toggle", () => {
  test("toggle persists across reload via localStorage", async ({ page }) => {
    await page.goto("/");

    // First visit — no explicit choice yet. The OS-emulated default is light
    // for Playwright's default config.
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);

    // Click the theme toggle.
    await page.getByRole("button", { name: /다크모드 토글/ }).click();
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);

    // Reload — the choice persists.
    await page.reload();
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
  });
});
