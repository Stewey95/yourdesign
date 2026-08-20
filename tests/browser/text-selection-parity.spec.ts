import { expect, test, type Locator, type Page } from "@playwright/test";

const FOUNDER_SENTENCE =
  "NUFC ARE THE RICHEST CLUB IN THE WHOLE ENTIRE WORLD AND WILL BE UCL CHAMPIONS ONE DAY WITHOUT A SINGLE DOUBT";
const DESKTOP_PROJECTS = new Set(["Desktop Chrome", "Desktop Safari"]);

type LogicalRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TextLayoutSample = {
  label: string;
  text: string;
  lines: string[];
  words: Array<{ text: string; rect: LogicalRect }>;
  item: LogicalRect;
  root: LogicalRect;
  display: LogicalRect;
  overlay: LogicalRect | null;
  rootOffset: { width: number; height: number };
  displayOffset: { width: number; height: number };
  displayScroll: { width: number; height: number };
  style: {
    fontSize: string;
    lineHeight: string;
    textAlign: string;
    whiteSpace: string;
    overflowWrap: string;
    wordBreak: string;
  };
  editor: null | {
    rect: LogicalRect;
    color: string;
    webkitTextFillColor: string;
    caretColor: string;
    scrollHeight: number;
    clientHeight: number;
  };
  glyphsContained: boolean;
};

async function nextPaint(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );
}

async function freshCanvas(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
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
  await page.goto("/create", { waitUntil: "networkidle" });
  await expect(page.locator(".editor-canvas-surface")).toBeVisible();
  await expect(page.locator('[data-editor-ready="true"]')).toBeVisible({
    timeout: 15_000,
  });
}

async function choosePreset(page: Page, presetName: string) {
  const preset = page.getByRole("button", {
    name: new RegExp(`^Use ${presetName} canvas`),
  });
  if (!(await preset.isVisible().catch(() => false))) {
    await page
      .getByRole("button", { name: "Arrange", exact: true })
      .first()
      .click();
  }
  await preset.click();
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

async function setFontSize(page: Page, size: number) {
  const input = page.locator('input[aria-label="Font size"]:visible').last();
  await expect(input).toBeVisible();
  await input.fill(String(size));
  await input.press("Enter");
  await expect(input).toHaveValue(String(size));
  await nextPaint(page);
}

async function deselectFromCanvas(page: Page) {
  await page.locator(".editor-canvas-surface").evaluate((element) => {
    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerId: 91,
        isPrimary: true,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        pointerId: 91,
        isPrimary: true,
      })
    );
  });
  await expect(page.locator("[data-selection-overlay]")).toHaveCount(0);
  await nextPaint(page);
}

async function enterEditing(item: Locator) {
  await item.locator("[data-canvas-text-display]").click();
  const editor = item.locator("[data-canvas-text-editor]");
  await expect(editor).toBeVisible();
  return editor;
}

async function sampleLayout(
  page: Page,
  itemId: string,
  label: string
): Promise<TextLayoutSample> {
  const sample = await page.evaluate(
    ({ itemId, label }) => {
      const item = document.querySelector<HTMLElement>(
        `[data-canvas-item-id="${itemId}"]`
      );
      const root = document.querySelector<HTMLElement>(
        `[data-canvas-text-root="${itemId}"]`
      );
      const display = document.querySelector<HTMLElement>(
        `[data-canvas-text-display="${itemId}"]`
      );
      const editor = document.querySelector<HTMLTextAreaElement>(
        `[data-canvas-text-editor="${itemId}"]`
      );
      const overlay = document.querySelector<HTMLElement>(
        `[data-selection-overlay="${itemId}"]`
      );
      const canvas = document.querySelector<HTMLElement>(
        ".editor-canvas-surface"
      );

      if (!item || !root || !display || !canvas) return null;

      const canvasRect = canvas.getBoundingClientRect();
      const scale = canvasRect.width / canvas.offsetWidth;
      const logicalRect = (element: Element): LogicalRect => {
        const rect = element.getBoundingClientRect();
        return {
          x: (rect.left - canvasRect.left) / scale,
          y: (rect.top - canvasRect.top) / scale,
          width: rect.width / scale,
          height: rect.height / scale,
        };
      };
      const wordElements = [
        ...display.querySelectorAll<HTMLElement>("[data-text-word]"),
      ];
      const words = wordElements.map((word) => ({
        text: word.textContent ?? "",
        rect: logicalRect(word),
      }));
      const lineRows: Array<{ y: number; words: string[] }> = [];

      for (const word of words) {
        const row = lineRows.find(
          (candidate) => Math.abs(candidate.y - word.rect.y) < 0.5
        );
        if (row) {
          row.words.push(word.text);
        } else {
          lineRows.push({ y: word.rect.y, words: [word.text] });
        }
      }

      const rootScreenRect = root.getBoundingClientRect();
      const glyphsContained = wordElements.every((word) => {
        const rect = word.getBoundingClientRect();
        return (
          rect.left >= rootScreenRect.left - 1 &&
          rect.right <= rootScreenRect.right + 1 &&
          rect.top >= rootScreenRect.top - 1 &&
          rect.bottom <= rootScreenRect.bottom + 1
        );
      });
      const displayStyle = getComputedStyle(display);
      const editorStyle = editor ? getComputedStyle(editor) : null;

      return {
        label,
        text: display.textContent ?? "",
        lines: lineRows.map((row) => row.words.join(" ")),
        words,
        item: logicalRect(item),
        root: logicalRect(root),
        display: logicalRect(display),
        overlay: overlay ? logicalRect(overlay) : null,
        rootOffset: { width: root.offsetWidth, height: root.offsetHeight },
        displayOffset: {
          width: display.offsetWidth,
          height: display.offsetHeight,
        },
        displayScroll: {
          width: display.scrollWidth,
          height: display.scrollHeight,
        },
        style: {
          fontSize: displayStyle.fontSize,
          lineHeight: displayStyle.lineHeight,
          textAlign: displayStyle.textAlign,
          whiteSpace: displayStyle.whiteSpace,
          overflowWrap: displayStyle.overflowWrap,
          wordBreak: displayStyle.wordBreak,
        },
        editor:
          editor && editorStyle
            ? {
                rect: logicalRect(editor),
                color: editorStyle.color,
                webkitTextFillColor: editorStyle.webkitTextFillColor,
                caretColor: editorStyle.caretColor,
                scrollHeight: editor.scrollHeight,
                clientHeight: editor.clientHeight,
              }
            : null,
        glyphsContained,
      };
    },
    { itemId, label }
  );

  if (!sample) throw new Error(`${label}: text layout was not rendered.`);
  return sample;
}

function expectRectEqual(
  actual: LogicalRect,
  expected: LogicalRect,
  tolerance = 0.35
) {
  expect(Math.abs(actual.x - expected.x)).toBeLessThan(tolerance);
  expect(Math.abs(actual.y - expected.y)).toBeLessThan(tolerance);
  expect(Math.abs(actual.width - expected.width)).toBeLessThan(tolerance);
  expect(Math.abs(actual.height - expected.height)).toBeLessThan(tolerance);
}

function expectLayoutParity(
  baseline: TextLayoutSample,
  candidate: TextLayoutSample
) {
  expect(candidate.text, candidate.label).toBe(baseline.text);
  expect(candidate.lines, candidate.label).toEqual(baseline.lines);
  expect(candidate.rootOffset, candidate.label).toEqual(baseline.rootOffset);
  expect(candidate.displayOffset, candidate.label).toEqual(
    baseline.displayOffset
  );
  expect(candidate.style, candidate.label).toEqual(baseline.style);
  expect(candidate.words.map((word) => word.text), candidate.label).toEqual(
    baseline.words.map((word) => word.text)
  );
  expectRectEqual(candidate.item, baseline.item);
  expectRectEqual(candidate.root, baseline.root);
  expectRectEqual(candidate.display, baseline.display);
  candidate.words.forEach((word, index) =>
    expectRectEqual(word.rect, baseline.words[index].rect)
  );
  expect(candidate.glyphsContained, candidate.label).toBe(true);
  expect(candidate.displayScroll.height, candidate.label).toBeLessThanOrEqual(
    candidate.displayOffset.height + 1
  );
}

function expectSelectedGeometry(sample: TextLayoutSample) {
  expect(sample.overlay, sample.label).not.toBeNull();
  // The overlay reads integer offset geometry; allow one logical pixel for
  // the browser's transformed sub-pixel rounding while keeping the text
  // renderer itself on the tighter parity tolerance above.
  expectRectEqual(sample.overlay!, sample.root, 1);
  expect(sample.glyphsContained, sample.label).toBe(true);
}

test.describe("text selection layout parity", () => {
  test("selection, editing and deselection preserve every canonical line at representative sizes", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    await freshCanvas(page);
    await choosePreset(page, "A4 Landscape");
    const item = await addText(page, FOUNDER_SENTENCE);
    const itemId = await item.getAttribute("data-canvas-item-id");
    if (!itemId) throw new Error("Text item id was not rendered.");
    const sizes = DESKTOP_PROJECTS.has(testInfo.project.name)
      ? [12, 24, 34, 47, 60, 80, 100]
      : [34, 47, 80];

    for (const size of sizes) {
      await setFontSize(page, size);
      const selected = await sampleLayout(page, itemId, `${size}px selected`);
      expectSelectedGeometry(selected);

      await deselectFromCanvas(page);
      const deselected = await sampleLayout(
        page,
        itemId,
        `${size}px deselected`
      );
      expectLayoutParity(selected, deselected);

      const editor = await enterEditing(item);
      await nextPaint(page);
      const editing = await sampleLayout(page, itemId, `${size}px editing`);
      expectLayoutParity(selected, editing);
      expectSelectedGeometry(editing);
      expect(editing.editor, `${size}px editor`).not.toBeNull();
      expect(editing.editor!.color).toBe("rgba(0, 0, 0, 0)");
      expect(editing.editor!.webkitTextFillColor).toBe(
        "rgba(0, 0, 0, 0)"
      );
      expect(editing.editor!.caretColor).not.toBe("rgba(0, 0, 0, 0)");
      // Safari reports the absolutely positioned textarea's transformed
      // height up to ~1 logical pixel differently from its equal integer
      // client/root height. The canonical visible display remains on the
      // tight parity comparison; this only accommodates replaced-control
      // transform rounding for the transparent caret surface.
      expectRectEqual(editing.editor!.rect, editing.root, 2);
      expect(editing.editor!.clientHeight).toBe(editing.rootOffset.height);

      await editor.blur();
      await expect(editor).toHaveCount(0);
      await nextPaint(page);
      const afterEditing = await sampleLayout(
        page,
        itemId,
        `${size}px after editing`
      );
      expectLayoutParity(selected, afterEditing);
      expectSelectedGeometry(afterEditing);

      await deselectFromCanvas(page);
      const deselectedAgain = await sampleLayout(
        page,
        itemId,
        `${size}px deselected again`
      );
      expectLayoutParity(selected, deselectedAgain);

      if (size === 47) {
        await testInfo.attach("47px-deselected-canonical-layout", {
          body: await page.screenshot(),
          contentType: "image/png",
        });
      }

      if (size !== sizes.at(-1)) {
        const nextEditor = await enterEditing(item);
        await nextEditor.blur();
        await expect(nextEditor).toHaveCount(0);
      }
    }
  });

  test("a large corner resize keeps the selected release layout after deselection", async ({
    page,
  }, testInfo) => {
    test.skip(
      !DESKTOP_PROJECTS.has(testInfo.project.name),
      "Desktop corner handles only"
    );
    await freshCanvas(page);
    await choosePreset(page, "A4 Landscape");
    const item = await addText(page, FOUNDER_SENTENCE);
    const itemId = await item.getAttribute("data-canvas-item-id");
    if (!itemId) throw new Error("Text item id was not rendered.");
    await setFontSize(page, 47);

    const handle = page.getByRole("button", {
      name: "Resize from bottom right",
    });
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error("Text resize handle was not rendered.");
    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 90, handleBox.y + 90, { steps: 8 });
    await page.mouse.up();

    const selectedRelease = await sampleLayout(
      page,
      itemId,
      "selected immediately after resize"
    );
    expect(Number.parseFloat(selectedRelease.style.fontSize)).toBeGreaterThan(47);
    expectSelectedGeometry(selectedRelease);
    await deselectFromCanvas(page);
    const deselected = await sampleLayout(
      page,
      itemId,
      "deselected after resize"
    );
    expectLayoutParity(selectedRelease, deselected);
  });

  test("bounded template text uses the same renderer while editing and deselected", async ({
    page,
  }) => {
    await freshCanvas(page);
    await page
      .getByRole("button", { name: "Templates", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "Use Template", exact: true }).nth(1).click();
    const display = page.locator("[data-canvas-text-display]").filter({
      hasText: "Creativity is intelligence having fun.",
    });
    await expect(display).toBeVisible();
    const item = display.locator("xpath=ancestor::*[@data-canvas-item-id]");
    const itemId = await item.getAttribute("data-canvas-item-id");
    if (!itemId) throw new Error("Template text item id was not rendered.");

    await deselectFromCanvas(page);
    const deselected = await sampleLayout(page, itemId, "bounded deselected");
    const editor = await enterEditing(item);
    await nextPaint(page);
    const editing = await sampleLayout(page, itemId, "bounded editing");
    expectLayoutParity(deselected, editing);
    expectSelectedGeometry(editing);
    await editor.blur();
    await expect(editor).toHaveCount(0);
    const afterEditing = await sampleLayout(
      page,
      itemId,
      "bounded after editing"
    );
    expectLayoutParity(deselected, afterEditing);
  });
});
