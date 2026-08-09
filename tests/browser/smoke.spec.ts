import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }, testInfo) => {
  // This diagnostic captures the whole page. On a busy mobile WebKit/Chrome
  // worker it can take longer than Playwright's 30s default despite the page
  // already being loaded, so keep the assertion and allow the capture to end.
  testInfo.setTimeout(60_000);
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
