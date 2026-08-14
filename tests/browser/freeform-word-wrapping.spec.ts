import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  getTextAlignment,
  wrapTextAtWordBoundaries,
} from "../../components/editor/textLayout";

const DESKTOP_PROJECTS = new Set(["Desktop Chrome", "Desktop Safari"]);
const MOBILE_PROJECTS = new Set(["iPhone Safari", "Android Chrome"]);
const FOUNDER_SENTENCE =
  "nufc are the best club in the world of football and are the richest club in the world";

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

async function choosePreset(page: Page, preset: string) {
  const option = page.getByRole("button", {
    name: new RegExp(`^Use ${preset} canvas`),
  });
  if (!(await option.isVisible().catch(() => false))) {
    await page
      .getByRole("button", { name: "Arrange", exact: true })
      .first()
      .click();
  }
  await option.click();
}

async function addText(page: Page, value: string) {
  await page.getByRole("button", { name: "Text", exact: true }).first().click();
  await page.getByRole("button", { name: "Add Text", exact: true }).click();
  const editor = page.locator("[data-canvas-text-editor]");
  await editor.fill(value);
  await editor.blur();
  return page.locator("[data-canvas-item-id]").last();
}

async function sampleWordLayout(item: Locator) {
  return item.evaluate((element) => {
    const htmlElement = element as HTMLElement;
    const display = element.querySelector<HTMLElement>(
      "[data-canvas-text-display]"
    );
    const overlay = document.querySelector<HTMLElement>(
      `[data-selection-overlay="${element.getAttribute("data-canvas-item-id")}"]`
    );
    const canvas = element.closest<HTMLElement>(".editor-canvas-surface");
    if (!display || !canvas) return null;
    const interactionBounds = canvas.parentElement?.hasAttribute(
      "data-canvas-viewport"
    )
      ? canvas.parentElement.getBoundingClientRect()
      : canvas.getBoundingClientRect();

    const displayRect = display.getBoundingClientRect();
    const itemRect = element.getBoundingClientRect();
    const root = element.querySelector<HTMLElement>(
      "[data-canvas-text-root]"
    );
    const rootRect = root?.getBoundingClientRect();
    const overlayRect = overlay?.getBoundingClientRect();
    const rows = new Map<
      number,
      { words: string[]; wordWidths: number[]; left: number; right: number; top: number }
    >();
    let glyphsFit = true;
    let wordsRemainWhole = true;

    for (const word of display.querySelectorAll<HTMLElement>(
      "[data-text-word]"
    )) {
      const wordRect = word.getBoundingClientRect();
      const textNode = word.firstChild;
      const wordLineTops = new Set<number>();

      if (textNode?.nodeType === Node.TEXT_NODE) {
        for (let index = 0; index < (textNode.textContent?.length ?? 0); index += 1) {
          const range = document.createRange();
          range.setStart(textNode, index);
          range.setEnd(textNode, index + 1);
          for (const rect of range.getClientRects()) {
            if (rect.width <= 0 || rect.height <= 0) continue;
            wordLineTops.add(Math.round(rect.top * 10) / 10);
            glyphsFit &&=
              rect.left >= displayRect.left - 2 &&
              rect.right <= displayRect.right + 2 &&
              rect.top >= displayRect.top - 2 &&
              rect.bottom <= displayRect.bottom + 2;
          }
        }
      }

      if (wordRect.width <= displayRect.width + 1 && wordLineTops.size !== 1) {
        wordsRemainWhole = false;
      }

      const key = Math.round(wordRect.top * 10) / 10;
      const row = rows.get(key) ?? {
        words: [],
        wordWidths: [],
        left: Number.POSITIVE_INFINITY,
        right: Number.NEGATIVE_INFINITY,
        top: wordRect.top,
      };
      row.words.push(word.textContent ?? "");
      row.wordWidths.push(wordRect.width);
      row.left = Math.min(row.left, wordRect.left);
      row.right = Math.max(row.right, wordRect.right);
      rows.set(key, row);
    }

    const scale = displayRect.width / display.offsetWidth;
    const style = getComputedStyle(display);
    const measure = document.createElement("canvas").getContext("2d");
    if (measure) {
      measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    }
    const spaceWidth = (measure?.measureText(" ").width ?? 0) * scale;
    const lines = [...rows.values()]
      .sort((a, b) => a.top - b.top)
      .map((row) => ({
        words: row.words,
        wordWidths: row.wordWidths,
        left: row.left,
        right: row.right,
        width: row.right - row.left,
        centre: (row.left + row.right) / 2,
      }));

    return {
      text: display.textContent,
      textAlign: style.textAlign,
      lines,
      lineCount: lines.length,
      displayLeft: displayRect.left,
      displayRight: displayRect.right,
      displayCentre: displayRect.left + displayRect.width / 2,
      displayWidth: displayRect.width,
      itemWidth: itemRect.width,
      itemLogicalWidth: htmlElement.offsetWidth,
      itemLogicalHeight: htmlElement.offsetHeight,
      rootLogicalWidth: root?.offsetWidth ?? 0,
      rootLogicalHeight: root?.offsetHeight ?? 0,
      logicalX: Number.parseFloat(htmlElement.style.left),
      logicalY: Number.parseFloat(htmlElement.style.top),
      availableLogicalWidth: Number.parseFloat(
        getComputedStyle(element).maxWidth
      ),
      itemCentre: {
        x: itemRect.left + itemRect.width / 2,
        y: itemRect.top + itemRect.height / 2,
      },
      rootCentre: rootRect
        ? {
            x: rootRect.left + rootRect.width / 2,
            y: rootRect.top + rootRect.height / 2,
          }
        : null,
      overlayCentre: overlayRect
        ? {
            x: overlayRect.left + overlayRect.width / 2,
            y: overlayRect.top + overlayRect.height / 2,
          }
        : null,
      canvasWidth: canvas.getBoundingClientRect().width,
      canvasLogicalWidth: canvas.offsetWidth,
      displayScale: interactionBounds.width / canvas.offsetWidth,
      overlayWidth: overlayRect?.width ?? null,
      overlayHeight: overlayRect?.height ?? null,
      itemHeight: itemRect.height,
      fontSize: Number.parseFloat(style.fontSize),
      spaceWidth,
      glyphsFit,
      wordsRemainWhole,
      previewActive: element.dataset.textResizePreview === "active",
      previewScale: Number.parseFloat(
        htmlElement.style.getPropertyValue(
          "--text-resize-preview-scale"
        ) || "1"
      ),
    };
  });
}

function expectCentredLines(layout: NonNullable<Awaited<ReturnType<typeof sampleWordLayout>>>) {
  for (const line of layout.lines) {
    expect(
      Math.abs(line.centre - layout.displayCentre),
      JSON.stringify(layout)
    ).toBeLessThan(Math.max(2, layout.spaceWidth + 1));
  }
}

function expectGreedyWholeWordWrap(
  layout: NonNullable<Awaited<ReturnType<typeof sampleWordLayout>>>
) {
  expect(layout.wordsRemainWhole, JSON.stringify(layout)).toBe(true);
  expect(layout.glyphsFit, JSON.stringify(layout)).toBe(true);
  for (let index = 0; index < layout.lines.length - 1; index += 1) {
    const nextWordWidth = layout.lines[index + 1].wordWidths[0];
    expect(
      layout.lines[index].width + layout.spaceWidth + nextWordWidth,
      JSON.stringify(layout)
    ).toBeGreaterThan(layout.displayWidth - 2);
  }
}

async function resizeWithLiveChecks(
  page: Page,
  item: Locator,
  delta: number,
  rotation = 0,
  verifyWholeWords = true,
  verifyGlyphContainment = true
) {
  const before = await sampleWordLayout(item);
  if (!before) throw new Error("Text layout was not rendered.");
  const startPosition = { x: before.logicalX, y: before.logicalY };
  const startAvailableWidth = before.availableLogicalWidth;
  const sizeVectorLengthSquared =
    before.rootLogicalWidth * before.rootLogicalWidth +
    before.rootLogicalHeight * before.rootLogicalHeight;
  const handle = page.getByRole("button", { name: "Resize from bottom right" });
  const box = await handle.boundingBox();
  if (!box) throw new Error("Text resize handle was not rendered.");
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  let previousPreviewWidth = before.itemWidth;

  for (let step = 1; step <= 12; step += 1) {
    await page.mouse.move(
      startX + (delta * step) / 12,
      startY + (delta * step) / 12
    );
    await nextPaint(page);
    const frame = await sampleWordLayout(item);
    if (!frame) throw new Error("Live text frame was not rendered.");
    expect(frame.lines.map((line) => line.words)).toEqual(
      before.lines.map((line) => line.words)
    );
    expect(frame.previewActive).toBe(true);
    const screenPointerChange =
      ((delta * step) / 12) / before.displayScale;
    const radians = (rotation * Math.PI) / 180;
    const horizontalChange =
      screenPointerChange * Math.cos(radians) +
      screenPointerChange * Math.sin(radians);
    const verticalChange =
      -screenPointerChange * Math.sin(radians) +
      screenPointerChange * Math.cos(radians);
    const expectedScale = Math.max(
      Number.EPSILON,
      1 +
        (2 *
          (horizontalChange * before.rootLogicalWidth +
            verticalChange * before.rootLogicalHeight)) /
          sizeVectorLengthSquared
    );
    expect(frame.previewScale).toBeCloseTo(expectedScale, 3);
    expect(frame.logicalX).toBeCloseTo(startPosition.x, 6);
    expect(frame.logicalY).toBeCloseTo(startPosition.y, 6);
    if (Number.isFinite(startAvailableWidth)) {
      expect(frame.availableLogicalWidth).toBeCloseTo(startAvailableWidth, 4);
    }
    if (verifyGlyphContainment) {
      expect(frame.glyphsFit).toBe(true);
    }
    if (verifyWholeWords) {
      expect(frame.wordsRemainWhole).toBe(true);
    }
    if (delta >= 0) {
      expect(frame.itemWidth).toBeGreaterThanOrEqual(
        previousPreviewWidth - 0.5
      );
    } else {
      expect(frame.itemWidth).toBeLessThanOrEqual(
        previousPreviewWidth + 0.5
      );
    }
    previousPreviewWidth = frame.itemWidth;
    expect(Math.abs((frame.rootCentre?.x ?? 0) - frame.itemCentre.x)).toBeLessThan(0.75);
    expect(Math.abs((frame.rootCentre?.y ?? 0) - frame.itemCentre.y)).toBeLessThan(0.75);
    expect(Math.abs((frame.overlayCentre?.x ?? 0) - frame.itemCentre.x)).toBeLessThan(0.75);
    expect(Math.abs((frame.overlayCentre?.y ?? 0) - frame.itemCentre.y)).toBeLessThan(0.75);
    expect(Math.abs(frame.itemWidth - (frame.overlayWidth ?? 0))).toBeLessThan(3);
    expect(Math.abs(frame.itemHeight - (frame.overlayHeight ?? 0))).toBeLessThan(3);
  }

  await page.mouse.up();
  await nextPaint(page);
  const committed = await sampleWordLayout(item);
  if (!committed) throw new Error("Committed text layout was not rendered.");
  expect(committed.previewActive).toBe(false);
  expect(committed.text).toBe(FOUNDER_SENTENCE);
  expect(committed.logicalX).toBeCloseTo(startPosition.x, 6);
  expect(committed.logicalY).toBeCloseTo(startPosition.y, 6);
  if (Number.isFinite(startAvailableWidth)) {
    expect(committed.availableLogicalWidth).toBeCloseTo(
      startAvailableWidth,
      4
    );
  }
  expect(
    Math.abs((committed.rootCentre?.x ?? 0) - committed.itemCentre.x)
  ).toBeLessThan(0.75);
  expect(
    Math.abs((committed.rootCentre?.y ?? 0) - committed.itemCentre.y)
  ).toBeLessThan(0.75);
  expect(
    Math.abs((committed.overlayCentre?.x ?? 0) - committed.itemCentre.x)
  ).toBeLessThan(0.75);
  expect(
    Math.abs((committed.overlayCentre?.y ?? 0) - committed.itemCentre.y)
  ).toBeLessThan(0.75);
  return committed;
}

async function dragText(page: Page, item: Locator, deltaX: number) {
  const box = await item.boundingBox();
  if (!box) throw new Error("Text item was not rendered.");
  const x = box.x + box.width / 2;
  const y = box.y + Math.min(box.height / 2, 24);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + deltaX, y, { steps: 12 });
  await page.mouse.up();
  await nextPaint(page);
}

async function seedAlignedProject(
  page: Page,
  textAlign: "left" | "center" | "right" | undefined
) {
  await page.goto("/");
  await page.evaluate(async (alignment) => {
    localStorage.clear();
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map(
        (database) =>
          new Promise<void>((resolve) => {
            const deletion = indexedDB.deleteDatabase(database.name ?? "");
            deletion.onsuccess = deletion.onerror = deletion.onblocked = () =>
              resolve();
          })
      )
    );

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("genvilo-editor", 3);
      request.onupgradeneeded = () => {
        for (const store of ["drafts", "projects", "products"]) {
          if (!request.result.objectStoreNames.contains(store)) {
            request.result.createObjectStore(store, {
              keyPath: store === "drafts" ? "key" : "id",
            });
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const projectId = `alignment-${alignment ?? "legacy"}`;
    const now = Date.now();
    const transaction = database.transaction("projects", "readwrite");
    transaction.objectStore("projects").put({
      id: projectId,
      title: "Alignment fixture",
      presetId: "landscape",
      canvasSize: { width: 360, height: 256 },
      items: [
        {
          id: "alignment-text",
          type: "text",
          hidden: false,
          locked: false,
          value: "one two three four five\nshort",
          position: { x: 180, y: 128 },
          fontSize: 20,
          color: "#0f172a",
          fontFamily: "Arial",
          rotation: 0,
          ...(alignment ? { textAlign: alignment } : {}),
        },
      ],
      createdAt: now,
      updatedAt: now,
    });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(transaction.error);
    });
    database.close();
    localStorage.setItem("gripix_active_project_id", projectId);
  }, textAlign);
  await page.goto("/create");
  await expect(page.locator('[data-canvas-item-id="alignment-text"]')).toBeVisible();
}

test.describe("Founder free-form word wrapping", () => {
  test("resize, edge movement and return to centre use the widest valid whole-word lines", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Desktop corner resize only");
    test.setTimeout(120_000);
    await freshCanvas(page);
    await choosePreset(page, "A4 Landscape");
    const item = await addText(page, FOUNDER_SENTENCE);
    const initial = await sampleWordLayout(item);
    if (!initial) throw new Error("Initial text layout was not rendered.");
    expect(initial.lineCount).toBe(1);
    expect(initial.textAlign).toBe("center");

    const growthWidths = [initial.itemLogicalWidth];
    let grown = initial;

    for (let gesture = 0; gesture < 6 && grown.lineCount === 1; gesture += 1) {
      grown = await resizeWithLiveChecks(page, item, 48);
      growthWidths.push(grown.itemLogicalWidth);
    }

    for (let index = 1; index < growthWidths.length; index += 1) {
      expect(growthWidths[index]).toBeGreaterThanOrEqual(
        growthWidths[index - 1] - 1
      );
    }
    expect(grown.lineCount).toBeGreaterThan(initial.lineCount);
    expect(grown.lineCount).toBeLessThanOrEqual(3);
    expect(grown.displayWidth).toBeGreaterThan(grown.canvasWidth * 0.85);
    expectGreedyWholeWordWrap(grown);
    expectCentredLines(grown);

    let shrunk = grown;
    for (let gesture = 0; gesture < 6 && shrunk.lineCount >= grown.lineCount; gesture += 1) {
      shrunk = await resizeWithLiveChecks(page, item, -48);
    }
    expect(shrunk.lineCount).toBeLessThan(grown.lineCount);
    expectGreedyWholeWordWrap(shrunk);
    expectCentredLines(shrunk);

    const centre = await sampleWordLayout(item);
    if (!centre) throw new Error("Centred text layout was not rendered.");
    const movement = centre.canvasWidth * 0.2;
    await dragText(page, item, movement);
    const nearRightEdge = await sampleWordLayout(item);
    if (!nearRightEdge) throw new Error("Moved text layout was not rendered.");
    expect(nearRightEdge.displayWidth).toBeLessThan(centre.displayWidth);
    expect(nearRightEdge.lineCount).toBeGreaterThanOrEqual(centre.lineCount);
    expectGreedyWholeWordWrap(nearRightEdge);
    expectCentredLines(nearRightEdge);

    await dragText(page, item, -movement);
    const returned = await sampleWordLayout(item);
    if (!returned) throw new Error("Returned text layout was not rendered.");
    expect(returned.displayWidth).toBeGreaterThan(nearRightEdge.displayWidth);
    expect(returned.lineCount).toBeLessThanOrEqual(nearRightEdge.lineCount);
    expectGreedyWholeWordWrap(returned);
    expectCentredLines(returned);

    await dragText(page, item, -movement);
    const nearLeftEdge = await sampleWordLayout(item);
    if (!nearLeftEdge) throw new Error("Left-edge text layout was not rendered.");
    expect(nearLeftEdge.displayWidth).toBeLessThan(returned.displayWidth);
    expect(nearLeftEdge.availableLogicalWidth).toBeLessThan(
      returned.availableLogicalWidth
    );
    await resizeWithLiveChecks(page, item, 24);

    await dragText(page, item, movement);
    const recentred = await sampleWordLayout(item);
    if (!recentred) throw new Error("Re-centred text layout was not rendered.");
    expect(recentred.availableLogicalWidth).toBeGreaterThan(
      nearLeftEdge.availableLogicalWidth
    );

    await page.getByRole("button", { name: "Rotate right" }).click();
    await page.getByRole("button", { name: "Rotate right" }).click();
    const rotated = await sampleWordLayout(item);
    if (!rotated) throw new Error("Rotated text layout was not rendered.");
    await resizeWithLiveChecks(page, item, 24, 30, false, false);
  });

  test("alignment values persist independently from object position and match the export DOM", async ({
    page,
  }, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Desktop alignment geometry");

    for (const alignment of [undefined, "center", "left", "right"] as const) {
      await seedAlignedProject(page, alignment);
      const item = page.locator('[data-canvas-item-id="alignment-text"]');
      const layout = await sampleWordLayout(item);
      if (!layout) throw new Error("Alignment text layout was not rendered.");
      const expected = alignment ?? "center";
      expect(layout.textAlign).toBe(expected);
      expect(
        await page
          .locator('[data-export-text="alignment-text"]')
          .evaluate((element) => getComputedStyle(element).textAlign)
      ).toBe(expected);

      if (expected === "center") {
        expectCentredLines(layout);
      } else if (expected === "left") {
        for (const line of layout.lines) {
          expect(Math.abs(line.left - layout.displayLeft)).toBeLessThan(2);
        }
      } else {
        for (const line of layout.lines) {
          expect(Math.abs(line.right - layout.displayRight)).toBeLessThan(2);
        }
      }
    }
  });

  test("the shared fallback contract preserves authored breaks and only splits an overlong word", ({}, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Shared contract covered once per desktop engine");
    expect(getTextAlignment({})).toBe("center");
    expect(getTextAlignment({ textAlign: "left" })).toBe("left");
    expect(getTextAlignment({ textAlign: "right" })).toBe("right");
    expect(
      wrapTextAtWordBoundaries("alpha beta\ngamma", 6, (value) => value.length)
    ).toEqual(["alpha", "beta", "gamma"]);
    expect(
      wrapTextAtWordBoundaries("abcdefgh", 4, (value) => value.length)
    ).toEqual(["abcd", "efgh"]);
  });

  test("mobile keeps boundary-wrapped words complete and centred inside the canvas", async ({
    page,
  }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.has(testInfo.project.name), "Mobile wrapping geometry");
    await freshCanvas(page);
    const item = await addText(page, FOUNDER_SENTENCE);
    const layout = await sampleWordLayout(item);
    if (!layout) throw new Error("Mobile text layout was not rendered.");
    expect(layout.lineCount).toBeGreaterThan(1);
    expect(layout.displayWidth).toBeLessThanOrEqual(layout.canvasWidth + 1);
    expect(layout.textAlign).toBe("center");
    expectGreedyWholeWordWrap(layout);
    expectCentredLines(layout);
  });
});
