import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const DESKTOP_PROJECTS = new Set(["Desktop Chrome", "Desktop Safari"]);
const RED_SQUARE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" viewBox="0 0 80 40"><rect width="80" height="40" fill="#ef4444"/></svg>`;

const freshCanvas = async (page: Page) => {
  await page.goto("/create");
  await page.evaluate(async () => {
    localStorage.clear();
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map(
        (database) =>
          new Promise((resolve) => {
            const request = indexedDB.deleteDatabase(database.name ?? "");
            request.onsuccess = request.onerror = request.onblocked = () =>
              resolve(undefined);
          })
      )
    );
  });
  await page.goto("/create");
  await page.waitForTimeout(400);
};

const openElements = async (page: Page) => {
  const input = page.locator('input[placeholder="Search elements..."]');
  if (!(await input.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: "Elements", exact: true }).first().click();
  }
  await expect(input).toBeVisible();
  return input;
};

const insertElement = async (page: Page, name: string) => {
  const input = await openElements(page);
  await input.fill(name);
  await page.getByRole("button", { name: `Add ${name}`, exact: true }).click();
  return page.locator("[data-canvas-item-id]").last();
};

const decodedImageStats = async (page: Page, file: string) => {
  const bytes = await readFile(file);

  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/*;base64,${base64}`;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Could not inspect exported image.");
    context.drawImage(image, 0, 0);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let nonWhite = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const [red, green, blue, alpha] = pixels.subarray(index, index + 4);
      if (alpha === 0) transparent += 1;
      if (alpha > 0 && (red < 245 || green < 245 || blue < 245)) {
        nonWhite += 1;
      }
    }

    return {
      width: canvas.width,
      height: canvas.height,
      transparent,
      nonWhite,
    };
  }, bytes.toString("base64"));
};

const openExport = async (page: Page) => {
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Download your design" })).toBeVisible();
  await page.getByRole("button", { name: /^Standard/ }).click();
};

test.describe("Editor and export reliability", () => {
  test("Hashtag's enclosed centre is an authored re-selection target", async ({ page }, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Mobile selection deliberately omits the desktop ring indicator");

    await freshCanvas(page);
    const item = await insertElement(page, "Hashtag");
    await expect(item).toBeVisible();

    const canvas = page.locator(".editor-canvas-surface");
    const canvasBox = await canvas.boundingBox();
    const itemBox = await item.boundingBox();
    if (!canvasBox || !itemBox) throw new Error("Canvas item was not rendered.");

    await page.mouse.click(canvasBox.x + 8, canvasBox.y + 8);
    await page.mouse.click(itemBox.x + itemBox.width / 2, itemBox.y + itemBox.height / 2);

    const itemId = await item.getAttribute("data-canvas-item-id");
    if (!itemId) throw new Error("Canvas item id was not rendered.");
    await expect(page.locator(`[data-selection-overlay="${itemId}"]`)).toBeVisible();
  });

  test("desktop Safari text can drag and resize through its corner handle", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "Desktop Safari", "Safari-specific regression coverage");

    await freshCanvas(page);
    await page.getByRole("button", { name: "Text", exact: true }).first().click();
    await page.getByRole("button", { name: "Add Text", exact: true }).click();
    const textarea = page.locator("[data-canvas-text-editor]");
    await textarea.fill("Safari text drag");

    const canvas = page.locator(".editor-canvas-surface");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("Canvas was not rendered.");
    await page.mouse.click(canvasBox.x + 8, canvasBox.y + 8);

    const item = page.locator("[data-canvas-item-id]").last();
    const beforeDrag = await item.boundingBox();
    if (!beforeDrag) throw new Error("Text item was not rendered.");

    await page.mouse.move(beforeDrag.x + beforeDrag.width / 2, beforeDrag.y + beforeDrag.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      beforeDrag.x + beforeDrag.width / 2 + 60,
      beforeDrag.y + beforeDrag.height / 2 + 30,
      { steps: 4 }
    );
    await page.mouse.up();

    const afterDrag = await item.boundingBox();
    if (!afterDrag) throw new Error("Dragged text item was not rendered.");
    expect(afterDrag.x - beforeDrag.x).toBeGreaterThan(20);

    const resizeHandle = page.getByRole("button", { name: "Resize from bottom right" });
    await expect(resizeHandle).toBeVisible();
    const beforeResize = await item.boundingBox();
    const handleBox = await resizeHandle.boundingBox();
    if (!beforeResize || !handleBox) throw new Error("Resize handle was not rendered.");

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2 + 50, handleBox.y + handleBox.height / 2 + 50, { steps: 4 });
    await page.mouse.up();

    const afterResize = await item.boundingBox();
    if (!afterResize) throw new Error("Resized text item was not rendered.");
    expect(afterResize.height).toBeGreaterThan(beforeResize.height + 5);
  });

  test("editor and export DOM use the same free-form text dimensions", async ({ page }, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Desktop text-rendering contract coverage");

    await freshCanvas(page);
    await page.getByRole("button", { name: "Text", exact: true }).first().click();
    await page.getByRole("button", { name: "Add Text", exact: true }).click();
    const textarea = page.locator("[data-canvas-text-editor]");
    await textarea.fill("Reliable editor and export text\nshare the same layout.");
    await textarea.blur();

    const itemId = await page.locator("[data-canvas-item-id]").last().getAttribute("data-canvas-item-id");
    if (!itemId) throw new Error("Text item id was not available.");

    const dimensions = await page.evaluate((id) => {
      const live = document.querySelector<HTMLElement>(`[data-canvas-text-display="${id}"]`);
      const exported = document.querySelector<HTMLElement>(`[data-export-text="${id}"]`);
      const surface = document.querySelector<HTMLElement>(".editor-canvas-surface");
      if (!live || !exported || !surface) return null;
      const liveRect = live.getBoundingClientRect();
      const exportRect = exported.getBoundingClientRect();
      const surfaceRect = surface.getBoundingClientRect();
      return {
        liveWidth: liveRect.width / (surfaceRect.width / 360),
        liveHeight: liveRect.height / (surfaceRect.width / 360),
        exportWidth: exportRect.width,
        exportHeight: exportRect.height,
      };
    }, itemId);

    expect(dimensions).not.toBeNull();
    // WebKit rounds its CSS zoom box to a fractional physical pixel before
    // reporting the rect. One logical pixel is sufficient to prove the
    // shared free-form layout contract; allow the small rounding remainder.
    expect(Math.abs(dimensions!.liveWidth - dimensions!.exportWidth)).toBeLessThan(1.5);
    expect(Math.abs(dimensions!.liveHeight - dimensions!.exportHeight)).toBeLessThan(1.5);
  });

  test("centre snap guides activate for every shipped canvas preset", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "Desktop Chrome", "One desktop audit covers every preset");
    test.setTimeout(120_000);

    await freshCanvas(page);
    const presets = [
      "Landscape", "Portrait", "Square", "A4 Portrait", "A4 Landscape",
      "A3 Portrait", "A3 Landscape", "Instagram Post", "Instagram Story",
      "Facebook Post", "YouTube Thumbnail", "Etsy Listing Image", "Pinterest Pin",
    ];

    for (const preset of presets) {
      await page.getByRole("button", { name: "Arrange", exact: true }).first().click();
      await page.getByRole("button", { name: new RegExp(`^Use ${preset} canvas`) }).click();
      const item = await insertElement(page, "Circle");
      const itemBox = await item.boundingBox();
      const canvasBox = await page.locator(".editor-canvas-surface").boundingBox();
      if (!itemBox || !canvasBox) throw new Error(`Could not audit ${preset}.`);

      await page.mouse.move(itemBox.x + itemBox.width / 2, itemBox.y + itemBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(itemBox.x + itemBox.width / 2 + 35, itemBox.y + itemBox.height / 2 + 35);
      await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);

      const guideVisibility = await page.locator(".editor-canvas-surface > div[aria-hidden]").evaluateAll((layers) =>
        layers.some((layer) => {
          const lines = layer.querySelectorAll("div");
          return Array.from(lines).filter((line) => line.style.visibility === "visible").length === 2;
        })
      );
      expect(guideVisibility, `${preset} should show both centre guides`).toBe(true);
      await page.mouse.up();
      await item.click();
      await page.keyboard.press("Delete");
    }
  });

  test("PNG, transparent PNG, JPG and print-ready PDF contain the design", async ({ page }, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Desktop renderer fidelity coverage");

    await freshCanvas(page);
    await page.getByRole("button", { name: "Media", exact: true }).first().click();
    await page.setInputFiles('input[type="file"]', {
      name: "red-square.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(RED_SQUARE_SVG),
    });
    await expect(page.locator("[data-canvas-item-id]")).toHaveCount(1);
    await page.getByRole("button", { name: "Text", exact: true }).first().click();
    await page.getByRole("button", { name: "Add Text", exact: true }).click();
    await page.locator("[data-canvas-text-editor]").fill("Export fidelity");
    const canvas = page.locator(".editor-canvas-surface");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("Canvas was not rendered.");
    await page.mouse.click(canvasBox.x + 8, canvasBox.y + 8);
    await openExport(page);

    const transparentSwitch = page.getByRole("switch");
    await transparentSwitch.click();
    const transparentDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PNG", exact: true }).click();
    const transparentPng = await transparentDownload;
    const transparentPath = await transparentPng.path();
    if (!transparentPath) throw new Error("Transparent PNG was not saved.");
    const transparentStats = await decodedImageStats(page, transparentPath);
    expect(transparentStats.width).toBe(360);
    expect(transparentStats.height).toBe(256);
    expect(transparentStats.transparent).toBeGreaterThan(1000);
    expect(transparentStats.nonWhite).toBeGreaterThan(100);

    await page.getByRole("button", { name: /^JPG\b/ }).click();
    const jpgDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download JPG", exact: true }).click();
    const jpg = await jpgDownload;
    const jpgPath = await jpg.path();
    if (!jpgPath) throw new Error("JPG was not saved.");
    const jpgStats = await decodedImageStats(page, jpgPath);
    expect(jpgStats.width).toBe(360);
    expect(jpgStats.height).toBe(256);
    expect(jpgStats.transparent).toBe(0);
    expect(jpgStats.nonWhite).toBeGreaterThan(100);

    await page.getByRole("button", { name: /^PDF\b/ }).click();
    await page.getByRole("button", { name: /^Print-ready PDF\b/ }).click();
    const pdfDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PDF", exact: true }).click();
    const pdf = await pdfDownload;
    const pdfPath = await pdf.path();
    if (!pdfPath) throw new Error("PDF was not saved.");
    const pdfContents = await readFile(pdfPath, "latin1");
    expect(pdfContents.startsWith("%PDF-")).toBe(true);
    expect(pdfContents).toContain("/DCTDecode");
    expect(pdfContents).toContain("/MediaBox");
  });
});
