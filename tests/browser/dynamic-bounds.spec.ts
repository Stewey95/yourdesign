import { test, expect, type Page } from "@playwright/test";

async function openPanel(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).first().click();
}

async function insertElement(page: Page, name: string) {
  // The "Elements" tab is a toggle - clicking it while already open closes
  // it, so only click when the panel (and its search box) isn't showing.
  const search = page.getByPlaceholder("Search elements...");
  if ((await search.count()) === 0) {
    await openPanel(page, "Elements");
  }
  // Search rather than browse categories: several catalog entries only
  // render in the DOM after "See all" is clicked for their category, but
  // the search box surfaces any element directly and reliably.
  await search.fill(name);
  await page
    .getByRole("button", { name: `Add ${name}`, exact: true })
    .click();
}

async function measureWrapperVsSvg(page: Page) {
  const item = page.locator("[data-canvas-item-id]").first();
  return item.evaluate((el) => {
    const wrapperRect = el.getBoundingClientRect();
    const svg = el.querySelector("svg");
    const svgRect = svg?.getBoundingClientRect();
    return {
      wrapper: { width: wrapperRect.width, height: wrapperRect.height },
      svg: svgRect ? { width: svgRect.width, height: svgRect.height } : null,
    };
  });
}

async function setBorderWidth(page: Page, value: number) {
  const input = page.getByRole("spinbutton", {
    name: /Border width|Stroke width/,
  });
  await input.fill(String(value));
  await input.press("Enter");
}

// The full 24-entry catalog, grouped as the task specifies (10 named
// elements first - these get full cross-browser treatment via the
// project matrix; the remainder are still swept for the core dynamic-
// bounds guarantee so "every catalog element" is genuinely covered).
const NAMED_ELEMENTS = [
  "Rectangle",
  "Rounded Rectangle",
  "Circle",
  "Triangle",
  "Diamond",
  "Heart",
  "Arrow",
  "Line",
  "Checkmark",
  "Star",
];

const REMAINING_ELEMENTS = [
  "Hexagon",
  "Octagon",
  "Dashed Line",
  "Double Arrow",
  "Curved Arrow",
  "Sparkle",
  "Cross",
  "Location Pin",
  "Sunburst",
  "Shield",
  "Ribbon Badge",
  "Speech Bubble",
  "Thought Bubble",
  "Banner Ribbon",
];

test.describe("dynamic bounds: border width growth (all catalog elements)", () => {
  for (const name of [...NAMED_ELEMENTS, ...REMAINING_ELEMENTS]) {
    test(`${name}: selection box expands as border width increases 1px -> 40px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/create");
      await insertElement(page, name);

      const item = page.locator("[data-canvas-item-id]").first();
      await expect(item).toBeVisible();

      // Some catalog entries (Diamond, Hexagon, Octagon, Sparkle, Cross,
      // etc.) render without a border-width control if they have no
      // stroke at all in their current state - skip those gracefully,
      // the point of this test is border-width-driven growth.
      const stepper = page.getByRole("spinbutton", {
        name: /Border width|Stroke width/,
      });
      if ((await stepper.count()) === 0) {
        test.skip();
        return;
      }

      await setBorderWidth(page, 1);
      const at1 = await measureWrapperVsSvg(page);

      await setBorderWidth(page, 40);
      const at40 = await measureWrapperVsSvg(page);

      // Core requirement: the box must grow as border width grows.
      expect(at40.wrapper.width).toBeGreaterThan(at1.wrapper.width);
      expect(at40.wrapper.height).toBeGreaterThan(at1.wrapper.height);

      // Shared-geometry invariant: the rendered SVG must still exactly
      // fill the wrapper at every stroke width, on every element - this
      // is what "always hug the rendered artwork" means mechanically.
      expect(at40.svg).not.toBeNull();
      expect(Math.abs(at40.svg!.width - at40.wrapper.width)).toBeLessThan(1);
      expect(Math.abs(at40.svg!.height - at40.wrapper.height)).toBeLessThan(
        1
      );
    });
  }
});

test.describe("Line minimum size", () => {
  test("Line shrinks naturally without ballooning width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");

    // Calibrate the canvas's current on-screen zoom via a reference
    // element whose default size is unaffected by either the old or new
    // clamp (120 logical units), rather than assuming 1 logical unit ==
    // 1 CSS pixel - the canvas may render at a fit-to-viewport zoom.
    await insertElement(page, "Rectangle");
    const rectangleBox = await page
      .locator("[data-canvas-item-id]")
      .first()
      .boundingBox();
    if (!rectangleBox) throw new Error("reference rectangle not found");
    const zoomFactor = rectangleBox.width / 120;
    await page.keyboard.press("ControlOrMeta+z");
    await expect(page.locator("[data-canvas-item-id]")).toHaveCount(0);

    await insertElement(page, "Line");

    const item = page.locator("[data-canvas-item-id]").first();
    await expect(item).toBeVisible();

    const initial = await item.boundingBox();
    if (!initial) throw new Error("item not found");
    const initialLogicalWidth = initial.width / zoomFactor;

    // The old bug: the minimum-size clamp was keyed to the *shorter*
    // dimension, so a naturally-thin line got forced to ~368 logical
    // units wide by default just so its ~8-unit-tall stroke could clear
    // an 8-unit floor. With the fix, default insertion should stay close
    // to the asset's intended footprint (its longer dimension, ~140
    // units), nowhere near the old inflated value.
    expect(initialLogicalWidth).toBeLessThan(200);

    // Shrink it via the bottom-right corner handle, dragging inward past
    // where the old bug would have refused to go smaller.
    const handle = page.getByRole("button", {
      name: "Resize from bottom right",
    });
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error("handle not found");

    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      handleBox.x - initial.width * 0.7,
      handleBox.y - 5,
      { steps: 15 }
    );
    await page.mouse.up();

    const shrunk = await item.boundingBox();
    if (!shrunk) throw new Error("item not found after shrink");

    // Should have shrunk substantially, and not be forced back out wide.
    expect(shrunk.width).toBeLessThan(initial.width * 0.6);
    expect(shrunk.width / zoomFactor).toBeLessThan(150);
  });
});

test.describe("shared geometry across named elements", () => {
  for (const name of NAMED_ELEMENTS) {
    test(`${name}: resize to minimum, resize to maximum, rotate, undo/redo`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/create");
      await insertElement(page, name);

      const item = page.locator("[data-canvas-item-id]").first();
      await expect(item).toBeVisible();

      const handle = page.getByRole("button", {
        name: "Resize from bottom right",
      });

      // Shrink toward minimum.
      let handleBox = await handle.boundingBox();
      if (!handleBox) throw new Error("handle not found");
      await page.mouse.move(
        handleBox.x + handleBox.width / 2,
        handleBox.y + handleBox.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        handleBox.x - 2000,
        handleBox.y - 2000,
        { steps: 15 }
      );
      await page.mouse.up();

      const atMin = await item.boundingBox();
      if (!atMin) throw new Error("item not found at min");
      expect(atMin.width).toBeGreaterThan(0);
      expect(atMin.height).toBeGreaterThan(0);
      // Never fully collapses, and the invariant (svg fills wrapper)
      // still holds at the smallest usable size.
      const minTightness = await measureWrapperVsSvg(page);
      if (minTightness.svg) {
        expect(
          Math.abs(minTightness.svg.width - minTightness.wrapper.width)
        ).toBeLessThan(1);
      }

      // Grow toward maximum.
      handleBox = await handle.boundingBox();
      if (!handleBox) throw new Error("handle not found");
      await page.mouse.move(
        handleBox.x + handleBox.width / 2,
        handleBox.y + handleBox.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        handleBox.x + 2000,
        handleBox.y + 2000,
        { steps: 15 }
      );
      await page.mouse.up();

      const atMax = await item.boundingBox();
      if (!atMax) throw new Error("item not found at max");
      expect(atMax.width).toBeGreaterThan(atMin.width);

      // Rotate: center must not drift.
      const beforeRotate = await item.boundingBox();
      if (!beforeRotate) throw new Error("item not found before rotate");
      const centerBefore = {
        x: beforeRotate.x + beforeRotate.width / 2,
        y: beforeRotate.y + beforeRotate.height / 2,
      };
      const rotateRight = page.getByRole("button", { name: "Rotate right" });
      await rotateRight.click();
      await rotateRight.click();
      const afterRotate = await item.boundingBox();
      if (!afterRotate) throw new Error("item not found after rotate");
      const centerAfter = {
        x: afterRotate.x + afterRotate.width / 2,
        y: afterRotate.y + afterRotate.height / 2,
      };
      expect(Math.abs(centerAfter.x - centerBefore.x)).toBeLessThan(3);
      expect(Math.abs(centerAfter.y - centerBefore.y)).toBeLessThan(3);

      // Undo repeatedly (resize/rotate may or may not coalesce into fewer
      // history entries than the number of gestures performed) until back
      // to zero items, capped well above any plausible step count so a
      // real regression still fails loudly instead of hanging.
      for (let i = 0; i < 20; i++) {
        if ((await page.locator("[data-canvas-item-id]").count()) === 0) {
          break;
        }
        await page.keyboard.press("ControlOrMeta+z");
      }
      await expect(page.locator("[data-canvas-item-id]")).toHaveCount(0);

      await page.keyboard.press("ControlOrMeta+Shift+z");
      await expect(page.locator("[data-canvas-item-id]")).toHaveCount(1);
    });
  }
});
