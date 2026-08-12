import { expect, test, type Locator, type Page } from "@playwright/test";

const DESKTOP_PROJECTS = new Set(["Desktop Chrome", "Desktop Safari"]);
const MOBILE_PROJECTS = new Set(["iPhone Safari", "Android Chrome"]);

type ResizeFrame = NonNullable<Awaited<ReturnType<typeof sampleResizeFrame>>>;

async function nextPaint(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );
}

async function freshCanvas(page: Page) {
  await page.goto("/create");
  await page.evaluate(async () => {
    localStorage.clear();
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map(
        (database) =>
          new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase(database.name ?? "");
            request.onsuccess = request.onerror = request.onblocked = () =>
              resolve();
          })
      )
    );
  });
  await page.goto("/create");
  await page.waitForTimeout(500);
}

async function addText(page: Page, value: string) {
  await page.getByRole("button", { name: "Text", exact: true }).first().click();
  await page.getByRole("button", { name: "Add Text", exact: true }).click();
  const editor = page.locator("[data-canvas-text-editor]");
  await editor.fill(value);
  await editor.blur();
  return page.locator("[data-canvas-item-id]").last();
}

async function sampleResizeFrame(page: Page, itemId: string) {
  return page.evaluate((id) => {
    const item = document.querySelector<HTMLElement>(
      `[data-canvas-item-id="${id}"]`
    );
    const display = document.querySelector<HTMLElement>(
      `[data-canvas-text-display="${id}"]`
    );
    const overlay = document.querySelector<HTMLElement>(
      `[data-selection-overlay="${id}"]`
    );
    const handle = document.querySelector<HTMLElement>(
      '[aria-label="Resize from bottom right"]'
    );
    if (!item || !display || !overlay || !handle) return null;

    const itemRect = item.getBoundingClientRect();
    const displayRect = display.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const textNode = Array.from(display.childNodes).find(
      (node): node is Text => node.nodeType === Node.TEXT_NODE
    );
    const glyphRects: DOMRect[] = [];
    const lineTops = new Set<number>();

    if (textNode) {
      for (let index = 0; index < textNode.length; index += 1) {
        if (/\s/.test(textNode.data[index])) continue;
        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + 1);
        for (const rect of range.getClientRects()) {
          if (rect.width <= 0 || rect.height <= 0) continue;
          glyphRects.push(rect);
          lineTops.add(Math.round(rect.top * 10) / 10);
        }
      }
    }

    const tolerance = 2;
    const glyphsFit = glyphRects.every(
      (rect) =>
        rect.left >= displayRect.left - tolerance &&
        rect.right <= displayRect.right + tolerance &&
        rect.top >= displayRect.top - tolerance &&
        rect.bottom <= displayRect.bottom + tolerance
    );
    const itemStyle = getComputedStyle(item);
    const displayStyle = getComputedStyle(display);

    return {
      fontSize: Number.parseFloat(displayStyle.fontSize),
      text: display.textContent,
      lineCount: lineTops.size,
      glyphCount: glyphRects.length,
      displayWidth: displayRect.width,
      displayHeight: displayRect.height,
      itemWidth: itemRect.width,
      itemHeight: itemRect.height,
      overlayWidth: overlayRect.width,
      overlayHeight: overlayRect.height,
      previewActive: item.dataset.textResizePreview === "active",
      previewScale: Number.parseFloat(
        item.style.getPropertyValue("--text-resize-preview-scale") || "1"
      ),
      glyphsFit,
      wrapperDoesNotClip:
        itemStyle.overflowX !== "hidden" &&
        itemStyle.overflowY !== "hidden" &&
        displayStyle.overflowX !== "hidden" &&
        displayStyle.overflowY !== "hidden",
      handleDeltaX: Math.abs(
        handleRect.left + handleRect.width / 2 - overlayRect.right
      ),
      handleDeltaY: Math.abs(
        handleRect.top + handleRect.height / 2 - overlayRect.bottom
      ),
    };
  }, itemId);
}

function assertRenderedFrame(
  frame: ResizeFrame,
  startingFrame: ResizeFrame,
  direction: "grow" | "shrink"
) {
  expect(frame.text).not.toBe("");
  expect(frame.glyphCount).toBeGreaterThan(0);
  expect(frame.lineCount).toBe(startingFrame.lineCount);
  expect(frame.fontSize).toBeCloseTo(startingFrame.fontSize, 3);
  expect(frame.previewActive).toBe(true);
  expect(frame.displayWidth).toBeGreaterThan(0);
  expect(frame.displayHeight).toBeGreaterThan(0);
  expect(frame.glyphsFit, JSON.stringify(frame)).toBe(true);
  expect(frame.wrapperDoesNotClip, JSON.stringify(frame)).toBe(true);
  // The invisible intrinsic measurement can be slightly taller than its
  // visible grid cell when a browser resolves an overflow-wrap opportunity.
  // What must stay locked during the gesture is the complete wrapper and its
  // selection overlay, while both visible and measured geometry scale by the
  // exact same ratio from their respective starting boxes.
  const overlayRoundingTolerance = 1.5 * frame.previewScale;
  expect(
    Math.abs(frame.overlayWidth - frame.itemWidth),
    JSON.stringify(frame)
  ).toBeLessThan(overlayRoundingTolerance);
  expect(
    Math.abs(frame.overlayHeight - frame.itemHeight),
    JSON.stringify(frame)
  ).toBeLessThan(overlayRoundingTolerance);
  expect(
    Math.abs(frame.itemWidth / startingFrame.itemWidth - frame.previewScale),
    JSON.stringify(frame)
  ).toBeLessThan(0.02);
  expect(
    Math.abs(frame.itemHeight / startingFrame.itemHeight - frame.previewScale),
    JSON.stringify(frame)
  ).toBeLessThan(0.02);
  expect(
    Math.abs(
      frame.displayWidth / startingFrame.displayWidth - frame.previewScale
    ),
    JSON.stringify(frame)
  ).toBeLessThan(0.02);
  expect(
    Math.abs(
      frame.displayHeight / startingFrame.displayHeight - frame.previewScale
    ),
    JSON.stringify(frame)
  ).toBeLessThan(0.02);
  expect(frame.handleDeltaX, JSON.stringify(frame)).toBeLessThan(2);
  expect(frame.handleDeltaY, JSON.stringify(frame)).toBeLessThan(2);

  if (direction === "grow") {
    expect(frame.previewScale).toBeGreaterThan(1);
    expect(frame.displayWidth).toBeGreaterThan(startingFrame.displayWidth);
    expect(frame.displayHeight).toBeGreaterThan(startingFrame.displayHeight);
  } else {
    expect(frame.previewScale).toBeLessThan(1);
    expect(frame.displayWidth).toBeLessThan(startingFrame.displayWidth);
    expect(frame.displayHeight).toBeLessThan(startingFrame.displayHeight);
  }
}

async function resizeAndSample(
  page: Page,
  itemId: string,
  direction: "grow" | "shrink"
) {
  const before = await sampleResizeFrame(page, itemId);
  if (!before) throw new Error("Text resize frame was not rendered.");
  const handle = page.getByRole("button", { name: "Resize from bottom right" });
  const handleBox = await handle.boundingBox();
  if (!handleBox) throw new Error("Text resize handle was not rendered.");

  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;
  const sign = direction === "grow" ? 1 : -1;
  await page.mouse.move(startX, startY);
  await page.mouse.down();

  const frames: ResizeFrame[] = [];
  for (let step = 1; step <= 6; step += 1) {
    await page.mouse.move(startX + sign * step * 7, startY + sign * step * 7);
    await nextPaint(page);
    const frame = await sampleResizeFrame(page, itemId);
    if (frame) frames.push(frame);
  }

  expect(frames).toHaveLength(6);
  for (const frame of frames) {
    assertRenderedFrame(frame, before, direction);
  }

  await page.mouse.up();
  await expect
    .poll(async () => (await sampleResizeFrame(page, itemId))?.previewActive)
    .toBe(false);
  const after = await sampleResizeFrame(page, itemId);
  if (!after) throw new Error("Committed text resize frame was not rendered.");
  expect(after.text).toBe(before.text);
  expect(after.glyphsFit, JSON.stringify(after)).toBe(true);
  expect(after.wrapperDoesNotClip, JSON.stringify(after)).toBe(true);
  if (direction === "grow") {
    expect(after.fontSize).toBeGreaterThan(before.fontSize);
  } else {
    expect(after.fontSize).toBeLessThan(before.fontSize);
  }
}

async function assertLiveResize(page: Page, item: Locator) {
  const itemId = await item.getAttribute("data-canvas-item-id");
  if (!itemId) throw new Error("Text item id was not rendered.");
  await expect(page.locator(`[data-selection-overlay="${itemId}"]`)).toBeVisible();
  await resizeAndSample(page, itemId, "grow");
  await resizeAndSample(page, itemId, "shrink");
}

test.describe("live text corner resize", () => {
  test("keeps every representative text layout complete and stable during grow and shrink frames", async ({
    page,
  }, testInfo) => {
    test.skip(
      !DESKTOP_PROJECTS.has(testInfo.project.name),
      "Desktop resize handles only"
    );
    test.setTimeout(120_000);

    for (const value of [
      "Live Safari resize",
      "One authored line\nAnd another",
      "Gripix free-form text stays complete while a long sentence wraps across several lines and is resized in either direction",
    ]) {
      await freshCanvas(page);
      await assertLiveResize(page, await addText(page, value));
    }

    await freshCanvas(page);
    await page.getByRole("button", { name: "Templates", exact: true }).first().click();
    await page.getByRole("button", { name: "Use Template", exact: true }).nth(1).click();
    const boundedText = page.locator("[data-canvas-text-display]").filter({
      hasText: "Creativity is intelligence having fun.",
    });
    const boundedItemId = await boundedText.evaluate((element) =>
      element.closest<HTMLElement>("[data-canvas-item-id]")?.dataset
        .canvasItemId ?? null
    );
    if (!boundedItemId) throw new Error("Template text item was not rendered.");
    const boundedItem = page.locator(
      `[data-canvas-item-id="${boundedItemId}"]`
    );
    await page.getByRole("button", {
      name: /^Select layer Creativity is intelligence/,
    }).click();
    await assertLiveResize(page, boundedItem);
  });

  test("mobile text selection keeps the contextual tools without desktop resize chrome", async ({
    page,
  }, testInfo) => {
    test.skip(
      !MOBILE_PROJECTS.has(testInfo.project.name),
      "Mobile selection only"
    );
    await freshCanvas(page);
    const item = await addText(page, "Mobile text selection");
    const itemId = await item.getAttribute("data-canvas-item-id");
    if (!itemId) throw new Error("Text item id was not rendered.");

    const overlay = page.locator(`[data-selection-overlay="${itemId}"]`);
    await expect(overlay).toBeVisible();
    await expect(overlay.locator("[data-selection-ring]")).toHaveCount(0);
    const contextualToolbar = page.locator("[data-mobile-context-toolbar]");
    await expect(contextualToolbar).toBeVisible();
    await expect(
      contextualToolbar.locator('input[aria-label="Text colour"]')
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resize from bottom right" })
    ).toHaveCount(0);

    await page
      .locator(".editor-canvas-surface")
      .click({ position: { x: 8, y: 8 } });
    await expect(
      page.locator(`[data-selection-overlay="${itemId}"]`)
    ).toHaveCount(0);
  });
});
