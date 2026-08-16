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
  await page.goto("/");
  await page.waitForLoadState("networkidle");
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
  await expect(page.locator(".editor-canvas-surface")).toBeVisible();
  await expect(page.locator('[data-editor-ready="true"]')).toBeVisible({
    timeout: 15_000,
  });
}

async function addText(page: Page, value: string) {
  await page.getByRole("button", { name: "Text", exact: true }).first().click();
  await page.getByRole("button", { name: "Add Text", exact: true }).click();
  const editor = page.locator("[data-canvas-text-editor]");
  await editor.fill(value);
  await editor.blur();
  const item = page.locator("[data-canvas-item-id]").last();
  await expect(item.locator("[data-canvas-text-display]")).toBeVisible();
  return item;
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
    const root = item?.querySelector<HTMLElement>(
      `[data-canvas-text-root="${id}"]`
    );
    const canvas = item?.closest<HTMLElement>(".editor-canvas-surface");
    const handle = document.querySelector<HTMLElement>(
      '[aria-label="Resize from bottom right"]'
    );
    if (!item || !display || !overlay || !handle || !root || !canvas) {
      return null;
    }

    const itemRect = item.getBoundingClientRect();
    const displayRect = display.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const interactionBounds = canvas.parentElement?.hasAttribute(
      "data-canvas-viewport"
    )
      ? canvas.parentElement.getBoundingClientRect()
      : canvas.getBoundingClientRect();
    const glyphRects: DOMRect[] = [];
    const lineTops = new Set<number>();

    const walker = document.createTreeWalker(display, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode() as Text | null;
    while (textNode) {
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
      textNode = walker.nextNode() as Text | null;
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
      displayScrollHeight: display.scrollHeight,
      displayClientHeight: display.clientHeight,
      itemWidth: itemRect.width,
      itemHeight: itemRect.height,
      rootLogicalWidth: root.offsetWidth,
      rootLogicalHeight: root.offsetHeight,
      logicalX: Number.parseFloat(item.style.left),
      logicalY: Number.parseFloat(item.style.top),
      availableLogicalWidth: Number.parseFloat(itemStyle.maxWidth),
      displayScale: interactionBounds.width / canvas.offsetWidth,
      itemCentreX: itemRect.left + itemRect.width / 2,
      itemCentreY: itemRect.top + itemRect.height / 2,
      rootCentreX: rootRect.left + rootRect.width / 2,
      rootCentreY: rootRect.top + rootRect.height / 2,
      overlayCentreX: overlayRect.left + overlayRect.width / 2,
      overlayCentreY: overlayRect.top + overlayRect.height / 2,
      overlayWidth: overlayRect.width,
      overlayHeight: overlayRect.height,
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
  previousFrame: ResizeFrame,
  direction: "grow" | "shrink"
) {
  expect(frame.text).not.toBe("");
  expect(frame.glyphCount).toBeGreaterThan(0);
  expect(frame.logicalX).toBeCloseTo(startingFrame.logicalX, 6);
  expect(frame.logicalY).toBeCloseTo(startingFrame.logicalY, 6);
  if (Number.isFinite(startingFrame.availableLogicalWidth)) {
    expect(frame.availableLogicalWidth).toBeCloseTo(
      startingFrame.availableLogicalWidth,
      4
    );
  }
  expect(Math.abs(frame.rootCentreX - frame.itemCentreX)).toBeLessThan(0.75);
  expect(Math.abs(frame.rootCentreY - frame.itemCentreY)).toBeLessThan(0.75);
  expect(Math.abs(frame.overlayCentreX - frame.itemCentreX)).toBeLessThan(0.75);
  expect(Math.abs(frame.overlayCentreY - frame.itemCentreY)).toBeLessThan(0.75);
  expect(frame.displayWidth).toBeGreaterThan(0);
  expect(frame.displayHeight).toBeGreaterThan(0);
  expect(frame.glyphsFit, JSON.stringify(frame)).toBe(true);
  expect(frame.wrapperDoesNotClip, JSON.stringify(frame)).toBe(true);
  // Every pointer frame is the canonical font-size/wrapping layout, not a
  // temporary transformed raster. Glyphs, the complete wrapper and the
  // selection overlay must therefore agree before pointerup.
  const overlayRoundingTolerance = 2;
  expect(
    Math.abs(frame.overlayWidth - frame.itemWidth),
    JSON.stringify(frame)
  ).toBeLessThan(overlayRoundingTolerance);
  expect(
    Math.abs(frame.overlayHeight - frame.itemHeight),
    JSON.stringify(frame)
  ).toBeLessThan(overlayRoundingTolerance);
  expect(frame.displayScrollHeight).toBeLessThanOrEqual(
    frame.displayClientHeight + 1
  );
  expect(frame.handleDeltaX, JSON.stringify(frame)).toBeLessThan(2);
  expect(frame.handleDeltaY, JSON.stringify(frame)).toBeLessThan(2);

  if (direction === "grow") {
    expect(frame.fontSize).toBeGreaterThan(startingFrame.fontSize);
    expect(frame.fontSize).toBeGreaterThanOrEqual(previousFrame.fontSize);
    expect(frame.fontSize / previousFrame.fontSize).toBeLessThan(1.25);
    expect(frame.itemWidth).toBeGreaterThanOrEqual(previousFrame.itemWidth - 1);
    expect(frame.lineCount).toBeGreaterThanOrEqual(previousFrame.lineCount);
  } else {
    expect(frame.fontSize).toBeLessThan(startingFrame.fontSize);
    expect(frame.fontSize).toBeLessThanOrEqual(previousFrame.fontSize);
    expect(previousFrame.fontSize / frame.fontSize).toBeLessThan(1.25);
    expect(frame.itemWidth).toBeLessThanOrEqual(previousFrame.itemWidth + 1);
    expect(frame.lineCount).toBeLessThanOrEqual(previousFrame.lineCount);
  }
}

function assertCommittedFrame(
  frame: ResizeFrame,
  startingFrame: ResizeFrame,
  direction: "grow" | "shrink"
) {
  expect(frame.logicalX).toBeCloseTo(startingFrame.logicalX, 6);
  expect(frame.logicalY).toBeCloseTo(startingFrame.logicalY, 6);
  if (Number.isFinite(startingFrame.availableLogicalWidth)) {
    expect(frame.availableLogicalWidth).toBeCloseTo(
      startingFrame.availableLogicalWidth,
      4
    );
  }
  expect(Math.abs(frame.rootCentreX - frame.itemCentreX)).toBeLessThan(0.75);
  expect(Math.abs(frame.rootCentreY - frame.itemCentreY)).toBeLessThan(0.75);
  expect(Math.abs(frame.overlayCentreX - frame.itemCentreX)).toBeLessThan(0.75);
  expect(Math.abs(frame.overlayCentreY - frame.itemCentreY)).toBeLessThan(0.75);
  expect(frame.text).toBe(startingFrame.text);
  expect(frame.glyphCount).toBe(startingFrame.glyphCount);
  expect(frame.lineCount).toBeGreaterThan(0);
  expect(frame.glyphsFit, JSON.stringify(frame)).toBe(true);
  expect(frame.wrapperDoesNotClip, JSON.stringify(frame)).toBe(true);
  expect(frame.displayScrollHeight).toBeLessThanOrEqual(
    frame.displayClientHeight + 1
  );
  expect(
    Math.abs(frame.overlayWidth - frame.itemWidth),
    JSON.stringify(frame)
  ).toBeLessThan(2);
  expect(
    Math.abs(frame.overlayHeight - frame.itemHeight),
    JSON.stringify(frame)
  ).toBeLessThan(2);
  expect(frame.handleDeltaX, JSON.stringify(frame)).toBeLessThan(2);
  expect(frame.handleDeltaY, JSON.stringify(frame)).toBeLessThan(2);

  if (direction === "grow") {
    expect(frame.fontSize).toBeGreaterThan(startingFrame.fontSize);
  } else {
    expect(frame.fontSize).toBeLessThan(startingFrame.fontSize);
  }
}

function expectGeometryUnchanged(
  committed: ResizeFrame,
  reselected: ResizeFrame
) {
  expect(reselected.text).toBe(committed.text);
  expect(reselected.lineCount).toBe(committed.lineCount);
  expect(reselected.fontSize).toBeCloseTo(committed.fontSize, 3);
  expect(reselected.glyphsFit, JSON.stringify(reselected)).toBe(true);
  expect(
    Math.abs(reselected.displayWidth - committed.displayWidth)
  ).toBeLessThan(1);
  expect(
    Math.abs(reselected.displayHeight - committed.displayHeight)
  ).toBeLessThan(1);
  expect(Math.abs(reselected.itemWidth - committed.itemWidth)).toBeLessThan(1);
  expect(Math.abs(reselected.itemHeight - committed.itemHeight)).toBeLessThan(
    1
  );
}

function getTextLayerLabel(value: string | null) {
  const words = (value ?? "").trim().split(/\s+/).filter(Boolean);
  const name = words.length === 0 ? "Text" : words.slice(0, 4).join(" ");
  const displayName = name.length > 30 ? `${name.slice(0, 29)}…` : name;

  return `Select layer ${displayName}`;
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
  let previousFrame = before;
  for (let step = 1; step <= 12; step += 1) {
    await page.mouse.move(
      startX + sign * step * 3.5,
      startY + sign * step * 3.5
    );
    await nextPaint(page);
    const frame = await sampleResizeFrame(page, itemId);
    if (frame) {
      assertRenderedFrame(frame, before, previousFrame, direction);
      frames.push(frame);
      previousFrame = frame;
    }
  }

  expect(frames).toHaveLength(12);
  await page.mouse.up();
  const immediate = await sampleResizeFrame(page, itemId);
  if (!immediate) {
    throw new Error("Immediate committed text frame was not rendered.");
  }
  assertCommittedFrame(immediate, before, direction);
  expectGeometryUnchanged(frames.at(-1)!, immediate);

  await nextPaint(page);
  const committed = await sampleResizeFrame(page, itemId);
  if (!committed) throw new Error("Stable committed text frame was not rendered.");
  assertCommittedFrame(committed, before, direction);
  expectGeometryUnchanged(immediate, committed);

  await page
    .locator(".editor-canvas-surface")
    .click({ position: { x: 8, y: 8 } });
  await expect(page.locator(`[data-selection-overlay="${itemId}"]`)).toHaveCount(
    0
  );
  await page
    .getByRole("button", { name: getTextLayerLabel(committed.text), exact: true })
    .click();
  await expect(
    page.locator(`[data-canvas-text-display="${itemId}"]`)
  ).toBeVisible();
  await expect(
    page.locator(`[data-selection-overlay="${itemId}"]`)
  ).toBeVisible();
  await nextPaint(page);
  const reselected = await sampleResizeFrame(page, itemId);
  if (!reselected) throw new Error("Reselected text frame was not rendered.");
  expectGeometryUnchanged(committed, reselected);
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
