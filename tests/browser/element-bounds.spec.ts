import { test, expect, type Page } from "@playwright/test";

async function openPanel(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).first().click();
}

async function insertElement(page: Page, name: string) {
  await openPanel(page, "Elements");
  await page
    .getByRole("button", { name: `Add ${name}`, exact: true })
    .click();
}

// Measures the wrapper's on-screen box vs. the actual painted extent of the
// SVG content inside it (via getBBox + stroke expansion, converted to
// screen pixels), so we can assert the selection box now hugs the artwork.
async function measureElementTightness(page: Page) {
  const item = page.locator("[data-canvas-item-id]").first();
  return item.evaluate((wrapperEl) => {
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const svg = wrapperEl.querySelector("svg");
    if (!svg) throw new Error("no svg found");

    const shapes = svg.querySelectorAll(
      "path, rect, circle, line, polygon, polyline"
    );

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    // getScreenCTM maps the shape's user space directly to viewport pixels
    // in one step (fully accounting for the SVG's position, any ancestor
    // transforms, scroll, and canvas zoom) - no manual composition needed.
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
        width: wrapperRect.width,
        height: wrapperRect.height,
      },
      visible: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
    };
  });
}

const ELEMENTS_TO_TEST = ["Line", "Arrow", "Heart", "Circle", "Rectangle"];

test.describe("SVG element selection bounds hug visible artwork", () => {
  for (const name of ELEMENTS_TO_TEST) {
    test(`${name}: wrapper closely matches painted extent`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/create");
      await insertElement(page, name);

      const item = page.locator("[data-canvas-item-id]").first();
      await expect(item).toBeVisible();

      const { wrapper, visible } = await measureElementTightness(page);

      // Wrapper edges should sit within ~1.5px of the actual painted edges
      // (sub-pixel rounding from getBBox/CTM math), not tens of pixels of
      // slack from an oversized authoring viewBox.
      const tolerance = 1.5;
      expect(Math.abs(wrapper.left - visible.minX)).toBeLessThan(tolerance);
      expect(Math.abs(wrapper.top - visible.minY)).toBeLessThan(tolerance);
      expect(Math.abs(wrapper.right - visible.maxX)).toBeLessThan(tolerance);
      expect(Math.abs(wrapper.bottom - visible.maxY)).toBeLessThan(tolerance);
    });
  }

  test("resize handles sit on the visible edges after the fix (Line)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await insertElement(page, "Line");

    const item = page.locator("[data-canvas-item-id]").first();
    await expect(item).toBeVisible();

    const { visible } = await measureElementTightness(page);

    // Measured via getBoundingClientRect (in-page JS), matching how
    // `visible` above was measured. Playwright's own .boundingBox() uses a
    // different internal code path that, on this Playwright/WebKit build,
    // reports coordinates at a different scale than in-page JS - mixing
    // the two APIs produces false mismatches here, so both sides of this
    // comparison must use the same measurement method.
    const handleCenters = await page.evaluate(() => {
      const centerOf = (label: string) => {
        const el = document.querySelector(
          `[aria-label="${label}"]`
        ) as HTMLElement | null;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      };
      return {
        topLeft: centerOf("Resize from top left"),
        bottomRight: centerOf("Resize from bottom right"),
      };
    });

    const tlCenter = handleCenters.topLeft;
    const brCenter = handleCenters.bottomRight;
    if (!tlCenter || !brCenter) throw new Error("handles not found");

    const tolerance = 2;
    expect(Math.abs(tlCenter.x - visible.minX)).toBeLessThan(tolerance);
    expect(Math.abs(tlCenter.y - visible.minY)).toBeLessThan(tolerance);
    expect(Math.abs(brCenter.x - visible.maxX)).toBeLessThan(tolerance);
    expect(Math.abs(brCenter.y - visible.maxY)).toBeLessThan(tolerance);
  });

  test("rotation still pivots around the item's own center (Rectangle)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await insertElement(page, "Rectangle");

    const item = page.locator("[data-canvas-item-id]").first();
    await expect(item).toBeVisible();

    const before = await item.boundingBox();
    if (!before) throw new Error("item not found");
    const centerBefore = {
      x: before.x + before.width / 2,
      y: before.y + before.height / 2,
    };

    // Rotate via the inspector's "Rotate right" control, four times (~360
    // degrees back to start is overkill; two 90 degree turns is enough to
    // prove the center doesn't drift).
    const rotateRight = page.getByRole("button", { name: "Rotate right" });
    await rotateRight.click();
    await rotateRight.click();

    const after = await item.boundingBox();
    if (!after) throw new Error("item not found after rotation");
    const centerAfter = {
      x: after.x + after.width / 2,
      y: after.y + after.height / 2,
    };

    expect(Math.abs(centerAfter.x - centerBefore.x)).toBeLessThan(2);
    expect(Math.abs(centerAfter.y - centerBefore.y)).toBeLessThan(2);
  });
});
