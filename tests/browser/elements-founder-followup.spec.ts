import { expect, test, type Page } from "@playwright/test";
import {
  ELEMENT_CATALOG,
  getElementColourMode,
  getElementSvgMarkup,
} from "../../components/editor/elements/elements.catalog";

async function freshCanvas(page: Page) {
  await page.goto("/create");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);
}

async function openElements(page: Page) {
  const search = page.getByPlaceholder("Search elements...");
  if (await search.isVisible().catch(() => false)) return search;

  await page.getByRole("button", { name: "Elements", exact: true }).first().click();
  const opened = await search
    .waitFor({ state: "visible", timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  // Mobile hydration can discard the first panel-open event while the
  // sidebar switches from its initial layout. Retrying the idempotent user
  // action makes this test exercise the panel, rather than that timing race.
  if (!opened) {
    await page.getByRole("button", { name: "Elements", exact: true }).first().click();
  }
  await expect(search).toBeVisible();
  return search;
}

async function insertElement(page: Page, name: string) {
  const search = await openElements(page);
  await search.fill(name);
  await page.getByRole("button", { name: `Add ${name}`, exact: true }).click();
}

test.describe("Elements Founder QA follow-up", () => {
  test("sidebar panels are immediate accordions with no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 840 });
    await page.goto("/create");

    const templates = page.getByRole("button", { name: "Templates", exact: true }).first();
    await templates.click();
    const templatesPanel = page.locator('[data-sidebar-panel="templates"]');
    await expect(templatesPanel).toBeVisible();
    await expect(templates.locator("xpath=following-sibling::*[1]")).toHaveAttribute(
      "data-sidebar-panel",
      "templates"
    );

    await page.getByRole("button", { name: "Elements", exact: true }).first().click();
    await expect(templatesPanel).toBeHidden();
    await expect(page.locator('[data-sidebar-panel="elements"]')).toBeVisible();

    const widths = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth + 1);
  });

  for (const name of ["Moon", "Sun", "Ice Cream Cone", "Hashtag", "Pencil", "Camera"]) {
    test(`search shows ${name} immediately below its input`, async ({ page }) => {
      await freshCanvas(page);
      const search = await openElements(page);
      await search.fill(name);

      const results = page.locator("[data-element-search-results]");
      await expect(results).toBeVisible();
      await expect(results.getByRole("button", { name: `Add ${name}`, exact: true })).toBeVisible();
      await expect(page.getByText("Categories", { exact: true })).toBeHidden();

      await results.getByRole("button", { name: `Add ${name}`, exact: true }).click();
      await expect(page.locator("[data-canvas-item-id]")).toHaveCount(1);
    });
  }

  test("See all Recent opens a distinct browsing view with a visible back control", async ({ page }) => {
    await freshCanvas(page);
    await insertElement(page, "Moon");

    const search = await openElements(page);
    await search.fill("");
    await page.getByRole("button", { name: "See all Recent", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Recent", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Back to all elements" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Moon", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Back to all elements" }).click();
    await expect(page.getByPlaceholder("Search elements...")).toBeVisible();
  });

  test("Moon is stroke-only in the visible inspector controls", async ({ page }, testInfo) => {
    await freshCanvas(page);
    await insertElement(page, "Moon");

    const styleButton = page.getByRole("button", { name: /style/i });
    if (await styleButton.isVisible().catch(() => false)) await styleButton.click();

    const strokeLabel = testInfo.project.name.startsWith("Desktop")
      ? "Stroke"
      : "Stroke colour";
    await expect(page.getByText(strokeLabel, { exact: true })).toBeVisible();
    await expect(page.getByText("Fill", { exact: true })).toHaveCount(0);
  });
});

test("catalogue colour metadata maps every exposed control to SVG paint", () => {
  expect(ELEMENT_CATALOG).toHaveLength(145);

  for (const asset of ELEMENT_CATALOG) {
    const mode = getElementColourMode(asset);
    const markup = getElementSvgMarkup(asset, {
      fill: "#e11d48",
      stroke: "#0ea5e9",
      strokeWidth: 7,
    });

    const exposesFill = mode === "fill" || mode === "fill-and-stroke";
    const exposesStroke = mode === "stroke" || mode === "fill-and-stroke";

    expect(markup.includes('fill="#e11d48"'), `${asset.name}: Fill capability`).toBe(exposesFill);
    expect(markup.includes('stroke="#0ea5e9"'), `${asset.name}: Stroke capability`).toBe(exposesStroke);
  }

  const moon = ELEMENT_CATALOG.find((asset) => asset.id === "nature-moon");
  expect(moon).toBeDefined();
  expect(getElementColourMode(moon!)).toBe("stroke");
  expect(getElementSvgMarkup(moon!, { fill: "#e11d48", stroke: "#0ea5e9" })).not.toContain('fill="#e11d48"');
});
