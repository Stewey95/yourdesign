import { expect, test, type Page } from "@playwright/test";

const DESKTOP_PROJECTS = new Set(["Desktop Chrome", "Desktop Safari"]);

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
    const item = document.querySelector<HTMLElement>(`[data-canvas-item-id="${id}"]`);
    const display = document.querySelector<HTMLElement>(`[data-canvas-text-display="${id}"]`);
    const overlay = document.querySelector<HTMLElement>(`[data-selection-overlay="${id}"]`);
    if (!item || !display || !overlay) return null;

    const range = document.createRange();
    range.selectNodeContents(display);
    const glyphs = range.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const displayRect = display.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();

    return {
      fontSize: Number.parseFloat(display.style.fontSize),
      text: display.textContent,
      displayWidth: displayRect.width,
      displayHeight: displayRect.height,
      glyphWidth: glyphs.width,
      glyphHeight: glyphs.height,
      itemWidth: itemRect.width,
      itemHeight: itemRect.height,
      overlayWidth: overlayRect.width,
      overlayHeight: overlayRect.height,
      glyphsFit:
        glyphs.width <= displayRect.width + 1 &&
        glyphs.height <= displayRect.height + 1,
    };
  }, itemId);
}

async function assertLiveResize(page: Page, item: ReturnType<Page["locator"]>) {
  const itemId = await item.getAttribute("data-canvas-item-id");
  if (!itemId) throw new Error("Text item id was not rendered.");

  await expect(page.locator(`[data-selection-overlay="${itemId}"]`)).toBeVisible();

  const before = await sampleResizeFrame(page, itemId);
  if (!before) throw new Error("Text resize frame was not rendered.");
  const handle = page.getByRole("button", { name: "Resize from bottom right" });
  const handleBox = await handle.boundingBox();
  if (!handleBox) throw new Error("Text resize handle was not rendered.");

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();

  const frames = [];
  for (let step = 1; step <= 6; step += 1) {
    await page.mouse.move(
      handleBox.x + handleBox.width / 2 + step * 12,
      handleBox.y + handleBox.height / 2 + step * 12
    );
    await page.waitForTimeout(16);
    const frame = await sampleResizeFrame(page, itemId);
    if (frame) frames.push(frame);
  }

  await page.mouse.up();
  const after = await sampleResizeFrame(page, itemId);

  expect(frames).toHaveLength(6);
  for (const frame of frames) {
    expect(frame.text).not.toBe("");
    expect(frame.displayWidth).toBeGreaterThan(0);
    expect(frame.displayHeight).toBeGreaterThan(0);
    expect(frame.glyphWidth).toBeGreaterThan(0);
    expect(frame.glyphHeight).toBeGreaterThan(0);
    expect(frame.glyphsFit, JSON.stringify(frame)).toBe(true);
    expect(Math.abs(frame.itemWidth - frame.displayWidth)).toBeLessThan(2);
    expect(Math.abs(frame.itemHeight - frame.displayHeight)).toBeLessThan(2);
    expect(Math.abs(frame.overlayWidth - frame.displayWidth), JSON.stringify(frame)).toBeLessThan(2);
    expect(Math.abs(frame.overlayHeight - frame.displayHeight), JSON.stringify(frame)).toBeLessThan(2);
  }
  expect(frames.at(-1)?.fontSize).toBeGreaterThan(before.fontSize);
  expect(after?.fontSize).toBeGreaterThan(before.fontSize);
}

test.describe("live text corner resize", () => {
  test("keeps free-form single-line, authored newline, and template text aligned during every frame", async ({ page }, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Desktop resize handles only");

    await freshCanvas(page);
    await assertLiveResize(page, await addText(page, "Live Safari resize"));

    await freshCanvas(page);
    await assertLiveResize(page, await addText(page, "One authored line\nAnd another"));

    await freshCanvas(page);
    await page.getByRole("button", { name: "Templates", exact: true }).first().click();
    await page.getByRole("button", { name: "Use Template", exact: true }).nth(1).click();
    const boundedText = page.locator("[data-canvas-text-display]").filter({
      hasText: "Creativity is intelligence having fun.",
    });
    const boundedItemId = await boundedText.evaluate((element) =>
      element.closest<HTMLElement>("[data-canvas-item-id]")?.dataset.canvasItemId ?? null
    );
    if (!boundedItemId) throw new Error("Template text item was not rendered.");
    const boundedItem = page.locator(`[data-canvas-item-id="${boundedItemId}"]`);
    await expect(boundedItem).toBeVisible();
    await page.getByRole("button", {
      name: /^Select layer Creativity is intelligence/,
    }).click();
    await assertLiveResize(page, boundedItem);
  });
});
