import { expect, test, type Page } from "@playwright/test";

const RED_SQUARE_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <rect width="100" height="100" fill="#ef4444"/>
  </svg>
`;

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

async function openPanel(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).first().click();
  await expect(
    page.locator(`[data-sidebar-panel="${name.toLowerCase()}"]`)
  ).toBeVisible();
}

async function addText(page: Page, value: string) {
  await openPanel(page, "Text");
  await page.getByRole("button", { name: "Add Text", exact: true }).click();
  const editor = page.locator("[data-canvas-text-editor]");
  await editor.fill(value);
  return editor;
}

async function insertElement(page: Page, name: string) {
  await openPanel(page, "Elements");
  const search = page.locator('input[placeholder="Search elements..."]');
  await search.fill(name);
  await page.getByRole("button", { name: `Add ${name}`, exact: true }).click();
}

test.describe("Founder QA follow-up - text layout", () => {
  test("new text is free-form until Enter, then persists and exports with the same mode", async ({ page }) => {
    await freshCanvas(page);
    const sentence = "NUFC are the best club in the world";
    const editor = await addText(page, sentence);

    await expect(editor).toHaveValue(sentence);
    const singleLine = await editor.boundingBox();
    if (!singleLine) throw new Error("Text editor was not rendered.");
    expect(singleLine.height).toBeLessThan(70);
    expect(singleLine.width).toBeGreaterThan(300);

    await editor.press("End");
    await editor.press("Enter");
    await editor.type("Howay the lads");
    const twoLines = await editor.boundingBox();
    if (!twoLines) throw new Error("Text editor was not rendered after Enter.");
    expect(twoLines.height).toBeGreaterThan(singleLine.height * 1.7);

    const canvas = page.locator(".editor-canvas-surface");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("Canvas was not rendered.");
    await editor.blur();

    const item = page.locator("[data-canvas-item-id]").last();
    const id = await item.getAttribute("data-canvas-item-id");
    if (!id) throw new Error("Text item id was not rendered.");
    const dimensions = await page.evaluate((itemId) => {
      const live = document.querySelector<HTMLElement>(
        `[data-canvas-text-display="${itemId}"]`
      );
      const exported = document.querySelector<HTMLElement>(
        `[data-export-text="${itemId}"]`
      );
      const surface = document.querySelector<HTMLElement>(".editor-canvas-surface");
      if (!live || !exported || !surface) return null;
      const scale = surface.getBoundingClientRect().width / 360;
      return {
        liveWidth: live.getBoundingClientRect().width / scale,
        liveHeight: live.getBoundingClientRect().height / scale,
        exportWidth: exported.getBoundingClientRect().width,
        exportHeight: exported.getBoundingClientRect().height,
      };
    }, id);
    expect(dimensions).not.toBeNull();
    expect(Math.abs(dimensions!.liveWidth - dimensions!.exportWidth)).toBeLessThan(2);
    expect(Math.abs(dimensions!.liveHeight - dimensions!.exportHeight)).toBeLessThan(2);

    await page.waitForTimeout(700);
    await page.reload();
    await expect(page.locator("[data-canvas-text-display]")).toHaveText(
      `${sentence}\nHoway the lads`
    );
  });

  test("corner resizing scales free-form text without changing its wrapping mode", async ({ page }, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Desktop resize handles only");
    await freshCanvas(page);
    await addText(page, "Scale this text");
    const canvas = page.locator(".editor-canvas-surface");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("Canvas was not rendered.");
    const editor = page.locator("[data-canvas-text-editor]");
    await editor.blur();

    const item = page.locator("[data-canvas-item-id]").last();
    const before = await item.boundingBox();
    const beforeMetrics = await item.evaluate((element) => {
      const text = element.querySelector<HTMLElement>("[data-canvas-text-display]");
      return {
        fontSize: text ? Number.parseFloat(text.style.fontSize) : 0,
        widthMode: element.style.width,
      };
    });
    const handle = page.getByRole("button", { name: "Resize from bottom right" });
    const handleBox = await handle.boundingBox();
    if (!before || !handleBox) throw new Error("Text resize handle was not rendered.");
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 60, handleBox.y + handleBox.height / 2 + 60, { steps: 5 });
    await page.mouse.up();

    const after = await item.boundingBox();
    if (!after) throw new Error("Scaled text item was not rendered.");
    expect(after.height).toBeGreaterThan(before.height + 8);
    const afterMetrics = await item.evaluate((element) => {
      const text = element.querySelector<HTMLElement>("[data-canvas-text-display]");
      return {
        fontSize: text ? Number.parseFloat(text.style.fontSize) : 0,
        widthMode: element.style.width,
      };
    });
    expect(afterMetrics.fontSize).toBeGreaterThan(beforeMetrics.fontSize);
    expect(afterMetrics.widthMode).toBe(beforeMetrics.widthMode);

    await page.getByRole("button", { name: "Undo" }).first().click();
    await expect.poll(async () => item.evaluate((element) => {
      const text = element.querySelector<HTMLElement>("[data-canvas-text-display]");
      return text ? Number.parseFloat(text.style.fontSize) : 0;
    })).toBe(beforeMetrics.fontSize);
    await page.getByRole("button", { name: "Redo" }).first().click();
    await expect.poll(async () => item.evaluate((element) => {
      const text = element.querySelector<HTMLElement>("[data-canvas-text-display]");
      return text ? Number.parseFloat(text.style.fontSize) : 0;
    })).toBe(afterMetrics.fontSize);

    const id = await item.getAttribute("data-canvas-item-id");
    if (!id) throw new Error("Scaled text item id was not rendered.");
    const widths = await page.evaluate((itemId) => {
      const live = document.querySelector<HTMLElement>(`[data-canvas-text-display="${itemId}"]`);
      const exported = document.querySelector<HTMLElement>(`[data-export-text="${itemId}"]`);
      const surface = document.querySelector<HTMLElement>(".editor-canvas-surface");
      if (!live || !exported || !surface) return null;
      const scale = surface.getBoundingClientRect().width / 360;
      return {
        live: live.getBoundingClientRect().width / scale,
        exported: exported.getBoundingClientRect().width,
      };
    }, id);
    expect(widths).not.toBeNull();
    expect(Math.abs(widths!.live - widths!.exported)).toBeLessThan(2);
  });

  test("template text restores as an explicitly bounded text area", async ({ page }) => {
    await freshCanvas(page);
    await openPanel(page, "Templates");
    await page.getByRole("button", { name: "Use Template", exact: true }).nth(1).click();

    const quote = page.locator("[data-canvas-text-display]").filter({
      hasText: "Creativity is intelligence having fun.",
    });
    await expect(quote).toBeVisible();
    const metrics = await quote.evaluate((element) => {
      const item = element.closest<HTMLElement>("[data-canvas-item-id]");
      if (!item) return null;
      return {
        width: Number.parseFloat(item.style.width),
        height: item.offsetHeight,
      };
    });
    expect(metrics).not.toBeNull();
    expect(metrics!.width).toBe(800);
    expect(metrics!.height).toBeGreaterThan(100);
  });
});

test.describe("Founder QA follow-up - visible snap guides", () => {
  test("every shipped preset renders centre guides at the canvas centre", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "Desktop Chrome", "A single visible desktop audit covers all presets");
    test.setTimeout(120_000);
    await freshCanvas(page);
    const presets = [
      "Landscape", "Portrait", "Square", "A4 Portrait", "A4 Landscape",
      "A3 Portrait", "A3 Landscape", "Instagram Post", "Instagram Story",
      "Facebook Post", "YouTube Thumbnail", "Etsy Listing Image", "Pinterest Pin",
    ];

    for (const preset of presets) {
      await openPanel(page, "Arrange");
      await page.getByRole("button", { name: new RegExp(`^Use ${preset} canvas`) }).click();
      await insertElement(page, "Circle");
      const item = page.locator("[data-canvas-item-id]").last();
      const itemBox = await item.boundingBox();
      const canvasBox = await page.locator(".editor-canvas-surface").boundingBox();
      if (!itemBox || !canvasBox) throw new Error(`Could not render ${preset}.`);

      await page.mouse.move(itemBox.x + itemBox.width / 2, itemBox.y + itemBox.height / 2);
      await page.mouse.down();
      // The item is inserted at the centre, so cross the drag threshold
      // before returning to it; otherwise no drag/snap gesture is active.
      await page.mouse.move(itemBox.x + itemBox.width / 2 + 35, itemBox.y + itemBox.height / 2 + 35);
      await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2, { steps: 5 });

      for (const axis of ["vertical", "horizontal"] as const) {
        const guide = page.locator(`[data-alignment-guide="${axis}"]`);
        await expect(guide).toBeVisible();
        await expect(guide).toHaveCSS("visibility", "visible");
        const guideBox = await guide.boundingBox();
        if (!guideBox) throw new Error(`${preset} ${axis} guide was not painted.`);
        const guideCentre = axis === "vertical"
          ? guideBox.x + guideBox.width / 2
          : guideBox.y + guideBox.height / 2;
        const canvasCentre = axis === "vertical"
          ? canvasBox.x + canvasBox.width / 2
          : canvasBox.y + canvasBox.height / 2;
        expect(Math.abs(guideCentre - canvasCentre), `${preset} ${axis} guide position`).toBeLessThan(1.5);
      }
      await page.mouse.up();
      await page.keyboard.press("Delete");
    }
  });
});

test.describe("Founder QA follow-up - selection controls over overlaps", () => {
  test("selected image and text resize handles remain on top of later overlapping content", async ({ page }, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Desktop resize handles only");
    await freshCanvas(page);
    await openPanel(page, "Media");
    await page.setInputFiles('input[type="file"]', {
      name: "red-square.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(RED_SQUARE_SVG),
    });
    await insertElement(page, "Rectangle");
    await page.getByRole("button", { name: "Select layer Image", exact: true }).click();
    const imageHandle = page.getByRole("button", { name: "Resize from bottom right" });
    await expect(imageHandle).toBeVisible();
    const imageHandleBox = await imageHandle.boundingBox();
    if (!imageHandleBox) throw new Error("Image resize handle was not rendered.");
    const imageHandleOwnsPoint = await page.evaluate(({ x, y }) =>
      document.elementFromPoint(x, y)?.closest('[aria-label^="Resize from"]')?.getAttribute("aria-label"),
      { x: imageHandleBox.x + imageHandleBox.width / 2, y: imageHandleBox.y + imageHandleBox.height / 2 }
    );
    expect(imageHandleOwnsPoint).toBe("Resize from bottom right");

    const layerOrder = () => page.locator('[aria-label^="Select layer "]').evaluateAll(
      (layers) => layers.map((layer) => layer.getAttribute("aria-label"))
    );
    expect(await layerOrder()).toEqual([
      "Select layer Rectangle",
      "Select layer Image",
    ]);
    await page.getByRole("button", { name: "Bring Forward" }).click();
    await expect.poll(layerOrder).toEqual([
      "Select layer Image",
      "Select layer Rectangle",
    ]);
    await page.getByRole("button", { name: "Send Backward" }).click();
    await expect.poll(layerOrder).toEqual([
      "Select layer Rectangle",
      "Select layer Image",
    ]);
    await page.getByRole("button", { name: "Bring to Front" }).click();
    await expect.poll(layerOrder).toEqual([
      "Select layer Image",
      "Select layer Rectangle",
    ]);
    await page.getByRole("button", { name: "Send to Back" }).click();
    await expect.poll(layerOrder).toEqual([
      "Select layer Rectangle",
      "Select layer Image",
    ]);

    await addText(page, "Text above an overlapping element");
    const canvas = page.locator(".editor-canvas-surface");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("Canvas was not rendered.");
    await page.locator("[data-canvas-text-editor]").blur();
    await insertElement(page, "Circle");
    await page.getByRole("button", { name: "Select layer Text above an overlapping" }).click();
    const textHandle = page.getByRole("button", { name: "Resize from bottom right" });
    await expect(textHandle).toBeVisible();
    const textHandleBox = await textHandle.boundingBox();
    if (!textHandleBox) throw new Error("Text resize handle was not rendered.");
    const textHandleOwnsPoint = await page.evaluate(({ x, y }) =>
      document.elementFromPoint(x, y)?.closest('[aria-label^="Resize from"]')?.getAttribute("aria-label"),
      { x: textHandleBox.x + textHandleBox.width / 2, y: textHandleBox.y + textHandleBox.height / 2 }
    );
    expect(textHandleOwnsPoint).toBe("Resize from bottom right");
  });
});

test("long element names retain a visible and accessible full name", async ({ page }) => {
  await freshCanvas(page);
  await openPanel(page, "Elements");
  const search = page.locator('input[placeholder="Search elements..."]');
  await search.fill("Invitation Card");
  const card = page.getByRole("button", { name: "Add Invitation Card", exact: true });
  await expect(card).toBeVisible();
  const label = card.locator("span").filter({ hasText: "Invitation Card" }).last();
  await expect(label).toHaveAttribute("title", "Invitation Card");
  await expect(label).toHaveAttribute("aria-label", "Invitation Card");
});
