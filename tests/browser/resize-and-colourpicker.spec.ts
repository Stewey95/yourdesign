import { test, expect, type Page } from "@playwright/test";

async function openPanel(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).first().click();
}

async function selectedItemLocator(page: Page) {
  return page.locator("[data-canvas-item-id]").first();
}

// Drags a corner resize handle with real pointer events. This exercises the
// exact same render path as pinch-resize (item.size updates -> CanvasItem /
// ElementSvg re-render), but works on every engine Playwright supports,
// including this environment's WebKit build, which does not expose a
// page-script `Touch` constructor for synthesizing multi-touch gestures.
async function dragResizeHandle(page: Page, steps = 24) {
  const item = await selectedItemLocator(page);
  const startBox = await item.boundingBox();
  if (!startBox) throw new Error("canvas item not found");

  const handle = page.getByRole("button", { name: "Resize from bottom right" });
  const handleBox = await handle.boundingBox();
  if (!handleBox) throw new Error("resize handle not found");

  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 160, startY + 160, { steps });
  await page.mouse.up();

  const endBox = await item.boundingBox();
  if (!endBox) throw new Error("canvas item not found after resize");

  return { startWidth: startBox.width, finalWidth: endBox.width };
}

// Dispatches a synthetic two-finger pinch gesture directly as native
// TouchEvents against the canvas surface, exactly like a real mobile pinch.
// Returns the width (px) sampled after every touchmove step, so the caller
// can inspect how continuously the resize progressed.
async function pinchResize(
  page: Page,
  opts: { steps?: number; startDistance?: number; endDistance?: number } = {}
) {
  const { steps = 24, startDistance = 60, endDistance = 260 } = opts;

  return page.evaluate(
    async ({ steps, startDistance, endDistance }) => {
      const surface = document.querySelector(".editor-canvas-surface");
      const itemEl = document.querySelector(
        "[data-canvas-item-id]"
      ) as HTMLElement | null;
      if (!surface || !itemEl) throw new Error("canvas item not found");

      const rect = itemEl.getBoundingClientRect();
      const centreX = rect.left + rect.width / 2;
      const centreY = rect.top + rect.height / 2;

      const makeTouches = (distance: number) => {
        const t1 = new Touch({
          identifier: 1,
          target: surface,
          clientX: centreX - distance / 2,
          clientY: centreY,
        });
        const t2 = new Touch({
          identifier: 2,
          target: surface,
          clientX: centreX + distance / 2,
          clientY: centreY,
        });
        return [t1, t2];
      };

      const dispatch = (type: string, touches: Touch[]) => {
        const event = new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          touches,
          targetTouches: touches,
          changedTouches: touches,
        });
        surface.dispatchEvent(event);
      };

      const widths: number[] = [];

      dispatch("touchstart", makeTouches(startDistance));
      await new Promise((r) => requestAnimationFrame(r));

      for (let i = 1; i <= steps; i++) {
        const distance =
          startDistance + ((endDistance - startDistance) * i) / steps;
        dispatch("touchmove", makeTouches(distance));
        await new Promise((r) => requestAnimationFrame(r));
        const w = itemEl.getBoundingClientRect().width;
        widths.push(Math.round(w * 100) / 100);
      }

      dispatch("touchend", []);

      return {
        widths,
        finalWidth: itemEl.getBoundingClientRect().width,
        startWidth: rect.width,
      };
    },
    { steps, startDistance, endDistance }
  );
}

// Counts DOM subtree replacements (childList mutations) on the resized
// item's own subtree while a callback runs. A full innerHTML reassignment
// (the pre-fix Elements bug) shows up here as repeated childList mutations;
// pure CSS width/height resizing (Images, Text, and now Elements) does not.
async function countSubtreeMutationsDuring(
  page: Page,
  action: () => Promise<unknown>
) {
  await page.evaluate(() => {
    const itemEl = document.querySelector("[data-canvas-item-id]");
    if (!itemEl) throw new Error("canvas item not found");
    (window as unknown as { __mutationCount: number }).__mutationCount = 0;
    const observer = new MutationObserver((records) => {
      (window as unknown as { __mutationCount: number }).__mutationCount +=
        records.filter((r) => r.type === "childList").length;
    });
    observer.observe(itemEl, { childList: true, subtree: true });
    (
      window as unknown as { __mutationObserver: MutationObserver }
    ).__mutationObserver = observer;
  });

  const result = await action();

  const mutationCount = await page.evaluate(() => {
    (
      window as unknown as { __mutationObserver: MutationObserver }
    ).__mutationObserver.disconnect();
    return (window as unknown as { __mutationCount: number })
      .__mutationCount;
  });

  return { mutationCount, result };
}

test.describe("resize pipeline", () => {
  test.beforeEach(async ({}, testInfo) => {
    // This Playwright/WebKit build doesn't expose a page-script `Touch`
    // constructor, so real multi-touch pinch dispatch only works on
    // Chromium here. WebKit is covered by the pointer-drag suite below,
    // which exercises the identical render path via the desktop resize
    // handle instead.
    test.skip(
      testInfo.project.name === "Desktop Safari" ||
        testInfo.project.name === "iPhone Safari",
      "WebKit build has no page-script Touch constructor; see pointer-drag suite"
    );
  });

  test("element pinch-resize does not thrash the SVG subtree", async ({
    page,
  }) => {
    // Item insertion goes through the desktop sidebar (reliable selectors);
    // the pinch mechanism under test is identical at any viewport size, and
    // this keeps the project's real engine/touch capability (WebKit on
    // "iPhone Safari", Chromium on "Android Chrome") untouched.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await openPanel(page, "Elements");
    await page.getByRole("button", { name: "Add Rectangle", exact: true }).click();

    const item = await selectedItemLocator(page);
    await expect(item).toBeVisible();

    const { mutationCount, result } = await countSubtreeMutationsDuring(
      page,
      () => pinchResize(page)
    );

    const resize = result as Awaited<ReturnType<typeof pinchResize>>;

    // Root-cause regression guard: before the fix, every pinch frame
    // reassigned dangerouslySetInnerHTML with a brand-new object, so React
    // rewrote domElement.innerHTML on every touchmove even though the
    // markup content never changed (fill/stroke/strokeWidth stayed put).
    // That shows up as one childList mutation per frame here.
    expect(mutationCount).toBe(0);

    // Functional guard: the element must still actually resize correctly.
    expect(resize.finalWidth).toBeGreaterThan(resize.startWidth * 1.5);
  });

  test("element pinch-resize progresses continuously (no dropped-frame steps)", async ({
    page,
  }) => {
    // Item insertion goes through the desktop sidebar (reliable selectors);
    // the pinch mechanism under test is identical at any viewport size, and
    // this keeps the project's real engine/touch capability (WebKit on
    // "iPhone Safari", Chromium on "Android Chrome") untouched.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await openPanel(page, "Elements");
    await page.getByRole("button", { name: "Add Rectangle", exact: true }).click();

    const resize = await pinchResize(page, { steps: 24 });
    const widths = resize.widths;

    const distinctValues = new Set(widths.map((w) => Math.round(w))).size;
    const increasingSteps = widths.filter(
      (w, i) => i === 0 || w > widths[i - 1]
    ).length;

    // With the bug, most frames get dropped (main thread busy re-parsing
    // innerHTML) so width barely changes for long stretches then jumps.
    // After the fix it should track the gesture on nearly every frame.
    expect(distinctValues).toBeGreaterThanOrEqual(Math.floor(widths.length * 0.8));
    expect(increasingSteps).toBeGreaterThanOrEqual(Math.floor(widths.length * 0.8));
  });

  test("image pinch-resize baseline (unmodified, must stay smooth)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    // Upload a tiny generated PNG via the Media panel.
    await openPanel(page, "Media");
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    await page.setInputFiles('input[type="file"]', {
      name: "pixel.png",
      mimeType: "image/png",
      buffer: Buffer.from(pngBase64, "base64"),
    });

    const item = await selectedItemLocator(page);
    await expect(item).toBeVisible();

    const { mutationCount, result } = await countSubtreeMutationsDuring(
      page,
      () => pinchResize(page)
    );
    const resize = result as Awaited<ReturnType<typeof pinchResize>>;

    expect(mutationCount).toBe(0);
    expect(resize.finalWidth).toBeGreaterThan(resize.startWidth * 1.5);
  });

  test("text pinch-resize baseline (unmodified, must stay smooth)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await openPanel(page, "Text");
    await page.getByRole("button", { name: "Add Text" }).click();

    const item = await selectedItemLocator(page);
    await expect(item).toBeVisible();

    const { mutationCount, result } = await countSubtreeMutationsDuring(
      page,
      () => pinchResize(page)
    );
    const resize = result as Awaited<ReturnType<typeof pinchResize>>;

    expect(mutationCount).toBe(0);
    expect(resize.finalWidth).toBeGreaterThan(resize.startWidth * 1.2);
  });
});

// Runs on every engine (including WebKit) via real pointer drag on the
// existing desktop corner-resize handle, which updates item.size through
// the same code path as pinch. This is the cross-browser (Chrome + Safari)
// confirmation that Elements no longer thrash their SVG subtree on resize.
test.describe("resize pipeline (pointer-drag, cross-engine)", () => {
  test("element drag-resize does not thrash the SVG subtree", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await openPanel(page, "Elements");
    await page
      .getByRole("button", { name: "Add Rectangle", exact: true })
      .click();

    const item = await selectedItemLocator(page);
    await expect(item).toBeVisible();

    const { mutationCount, result } = await countSubtreeMutationsDuring(
      page,
      () => dragResizeHandle(page)
    );
    const resize = result as Awaited<ReturnType<typeof dragResizeHandle>>;

    expect(mutationCount).toBe(0);
    expect(resize.finalWidth).toBeGreaterThan(resize.startWidth * 1.3);
  });
});

test.describe("colour picker parity", () => {
  test("floats above the editor, never clips, and is draggable", async ({
    page,
  }, testInfo) => {
    // Item insertion goes through the desktop sidebar (reliable selectors);
    // the pinch mechanism under test is identical at any viewport size, and
    // this keeps the project's real engine/touch capability (WebKit on
    // "iPhone Safari", Chromium on "Android Chrome") untouched.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await openPanel(page, "Elements");
    await page.getByRole("button", { name: "Add Rectangle", exact: true }).click();

    // Open the element's fill colour swatch trigger.
    const swatchTrigger = page.getByRole("button", { name: "Fill colour" });
    await swatchTrigger.click();

    const popover = page.locator('[data-editor-retain-selection].fixed.z-\\[1000\\]');
    await expect(popover).toBeVisible();

    // Must be portaled directly onto <body>, not nested inside a clipping
    // ancestor (sidebar/inspector panels use overflow-auto containers).
    const parentTag = await popover.evaluate(
      (el) => el.parentElement?.tagName
    );
    expect(parentTag).toBe("BODY");

    const before = await popover.boundingBox();
    expect(before).not.toBeNull();

    // Drag the header (the picker's own drag handle) to a new position.
    const handle = popover.locator("div.cursor-grab").first();
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error("drag handle not found");

    // The picker anchors near the right edge of the viewport (below the
    // inspector's Fill trigger), so drag toward the open space (up-left)
    // rather than further into the edge, which would correctly clamp.
    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      handleBox.x + handleBox.width / 2 - 150,
      handleBox.y + handleBox.height / 2 - 100,
      { steps: 10 }
    );
    await page.mouse.up();

    const after = await popover.boundingBox();
    expect(after).not.toBeNull();
    expect(
      Math.abs((after!.x ?? 0) - (before!.x ?? 0)) +
        Math.abs((after!.y ?? 0) - (before!.y ?? 0))
    ).toBeGreaterThan(50);

    await page.screenshot({
      path: `test-results/screenshots/${testInfo.project.name}-colourpicker-dragged.png`,
    });
  });
});
