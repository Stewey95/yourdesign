import { test, expect, type Page } from "@playwright/test";

async function openPanel(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).first().click();
}

async function insertElement(page: Page, name: string) {
  await openPanel(page, "Elements");
  // Search rather than relying on default grouped-view visibility - several
  // categories now have more than the 6 items shown by default per section.
  await page.locator('input[placeholder="Search elements..."]').fill(name);
  await page
    .getByRole("button", { name: `Add ${name}`, exact: true })
    .click();
}

async function measureElementTightness(page: Page) {
  const item = page.locator("[data-canvas-item-id]").first();
  return item.evaluate((wrapperEl) => {
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const svg = wrapperEl.querySelector("svg");
    if (!svg) throw new Error("no svg found");

    const shapes = svg.querySelectorAll(
      "path, rect, circle, line, polygon, polyline, ellipse"
    );

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    shapes.forEach((shape) => {
      const b = (shape as SVGGraphicsElement).getBBox();
      if (b.width === 0 && b.height === 0) return;
      const strokeAttr = shape.getAttribute("stroke");
      const hasStroke = strokeAttr && strokeAttr !== "none";
      const strokeWidth = hasStroke
        ? Number(shape.getAttribute("stroke-width") || "1")
        : 0;
      const pad = strokeWidth / 2;
      const ctm = (shape as SVGGraphicsElement).getScreenCTM();
      if (!ctm) return;

      const corners = [
        [b.x - pad, b.y - pad],
        [b.x + b.width + pad, b.y - pad],
        [b.x - pad, b.y + b.height + pad],
        [b.x + b.width + pad, b.y + b.height + pad],
      ];

      corners.forEach(([x, y]) => {
        const screenX = ctm.a * x + ctm.c * y + ctm.e;
        const screenY = ctm.b * x + ctm.d * y + ctm.f;
        minX = Math.min(minX, screenX);
        minY = Math.min(minY, screenY);
        maxX = Math.max(maxX, screenX);
        maxY = Math.max(maxY, screenY);
      });
    });

    return {
      wrapper: {
        left: wrapperRect.left,
        top: wrapperRect.top,
        right: wrapperRect.right,
        bottom: wrapperRect.bottom,
      },
      visible: { minX, minY, maxX, maxY },
    };
  });
}

// One representative element from each of the 8 new categories, chosen to
// cover both simple (basic path) and compound (multiple shapes/circles)
// geometry, plus the flagged high-drift and fill-and-stroke edge cases.
const ELEMENTS_TO_TEST = [
  "Briefcase",
  "Thumbs Up",
  "Leaf",
  "Apple",
  "Laptop",
  "Graduation Cap",
  "Confetti Burst",
  "Flourish Scroll",
  "Crown",
];

test.describe("new catalog elements: selection bounds hug visible artwork", () => {
  for (const name of ELEMENTS_TO_TEST) {
    test(`${name}: wrapper closely matches painted extent`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/create");
      await insertElement(page, name);

      const item = page.locator("[data-canvas-item-id]").first();
      await expect(item).toBeVisible();

      const { wrapper, visible } = await measureElementTightness(page);

      const tolerance = 2;
      expect(Math.abs(wrapper.left - visible.minX)).toBeLessThan(tolerance);
      expect(Math.abs(wrapper.top - visible.minY)).toBeLessThan(tolerance);
      expect(Math.abs(wrapper.right - visible.maxX)).toBeLessThan(tolerance);
      expect(Math.abs(wrapper.bottom - visible.maxY)).toBeLessThan(tolerance);
    });
  }
});
