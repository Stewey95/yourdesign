import { test, expect } from "@playwright/test";

const ELEMENTS = ["Line", "Arrow", "Heart", "Circle", "Rectangle"];

test.describe("visual check", () => {
  for (const name of ELEMENTS) {
    test(`screenshot: ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/create");
      await page.getByRole("button", { name: "Elements", exact: true }).first().click();
      await page
        .getByRole("button", { name: `Add ${name}`, exact: true })
        .click();

      const item = page.locator("[data-canvas-item-id]").first();
      await expect(item).toBeVisible();

      await page.screenshot({
        path: `test-results/screenshots/visual-${name}.png`,
      });
    });
  }
});
