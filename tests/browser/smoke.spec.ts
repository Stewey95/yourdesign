import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await page.screenshot({
    path: `test-results/screenshots/${testInfo.project.name}-home.png`,
    fullPage: true,
  });
});

test("editor loads and canvas is present", async ({ page }, testInfo) => {
  await page.goto("/create");
  await expect(page.locator("body")).toBeVisible();
  await page.screenshot({
    path: `test-results/screenshots/${testInfo.project.name}-editor.png`,
    fullPage: true,
  });
});
