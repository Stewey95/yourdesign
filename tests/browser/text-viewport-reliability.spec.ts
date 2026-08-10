import { expect, test, type Locator, type Page } from "@playwright/test";

const DESKTOP_PROJECTS = new Set(["Desktop Chrome", "Desktop Safari"]);
const MOBILE_PROJECTS = new Set(["iPhone Safari", "Android Chrome"]);

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
  await page.waitForTimeout(600);
}

async function addText(page: Page, value: string) {
  await page.getByRole("button", { name: "Text", exact: true }).first().click();
  await page.getByRole("button", { name: "Add Text", exact: true }).click();
  const editor = page.locator("[data-canvas-text-editor]");
  await editor.fill(value);
  await editor.blur();
  return page.locator("[data-canvas-item-id]").last();
}

async function textGeometry(item: Locator) {
  return item.evaluate((element) => {
    const display = element.querySelector<HTMLElement>(
      "[data-canvas-text-display]"
    );
    const canvas = element.closest<HTMLElement>(".editor-canvas-surface");
    if (!display || !canvas) return null;

    const itemRect = element.getBoundingClientRect();
    const displayRect = display.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const logicalScale = canvasRect.width / canvas.offsetWidth;

    return {
      itemWidth: itemRect.width / logicalScale,
      itemHeight: itemRect.height / logicalScale,
      displayWidth: displayRect.width / logicalScale,
      canvasWidth: canvas.offsetWidth,
      left: (itemRect.left - canvasRect.left) / logicalScale,
      right: (itemRect.right - canvasRect.left) / logicalScale,
      maxWidth: Number.parseFloat(element.style.maxWidth),
      authoredValue: display.textContent,
      lineHeight: Number.parseFloat(getComputedStyle(display).lineHeight),
      textBoxWidth: element.style.width,
    };
  });
}

async function dragItem(page: Page, item: Locator, deltaX: number) {
  const box = await item.boundingBox();
  if (!box) throw new Error("Text item was not rendered.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + deltaX,
    box.y + box.height / 2,
    { steps: 6 }
  );
  await page.mouse.up();
}

async function expectCanvasCentred(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const canvas = document.querySelector<HTMLElement>(
          "[data-canvas-viewport]"
        );
        const workspace = document.querySelector<HTMLElement>(
          ".editor-workspace-surface"
        );
        if (!canvas || !workspace) return null;
        const canvasRect = canvas.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        return {
          x:
            canvasRect.left +
            canvasRect.width / 2 -
            (workspaceRect.left + workspaceRect.width / 2),
          y:
            canvasRect.top +
            canvasRect.height / 2 -
            (workspaceRect.top + workspaceRect.height / 2),
        };
      })
    )
    .toEqual({ x: expect.closeTo(0, 1), y: expect.closeTo(0, 1) });
}

async function pressMobileFit(page: Page) {
  const fit = page.getByRole("button", { name: "Fit canvas to workspace" });
  if (!(await fit.isVisible().catch(() => false))) {
    await page
      .getByRole("button", { name: "Canvas zoom", exact: true })
      .click();
  }
  await fit.click();
  await page.waitForTimeout(250);
}

async function choosePreset(page: Page, preset: string) {
  const option = page.getByRole("button", {
    name: new RegExp(`^Use ${preset} canvas`),
  });
  if (!(await option.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: "Arrange", exact: true }).first().click();
  }
  await option.click();
}

test.describe("shared text boundary contract", () => {
  test("free-form text hugs short content and wraps only at its real canvas boundary", async ({ page }) => {
    await freshCanvas(page);

    const shortItem = await addText(page, "Short text");
    const short = await textGeometry(shortItem);
    expect(short).not.toBeNull();
    expect(short!.itemWidth).toBeLessThan(short!.canvasWidth / 2);
    expect(short!.itemHeight).toBeLessThan(short!.lineHeight * 1.5);
    expect(short!.textBoxWidth).toBe("max-content");

    await freshCanvas(page);
    const longItem = await addText(
      page,
      "Gripix free-form text stays natural while room exists and wraps when the physical canvas boundary is genuinely reached"
    );
    const centred = await textGeometry(longItem);
    expect(centred).not.toBeNull();
    expect(centred!.maxWidth).toBeCloseTo(centred!.canvasWidth, 0);
    expect(centred!.itemWidth).toBeLessThanOrEqual(centred!.maxWidth + 1);
    expect(centred!.itemHeight).toBeGreaterThan(centred!.lineHeight * 1.5);
    expect(centred!.left).toBeGreaterThanOrEqual(-1);
    expect(centred!.right).toBeLessThanOrEqual(centred!.canvasWidth + 1);

    const canvas = page.locator(".editor-canvas-surface");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("Canvas was not rendered.");
    await dragItem(page, longItem, canvasBox.width * 0.18);
    const nearEdge = await textGeometry(longItem);
    expect(nearEdge).not.toBeNull();
    expect(nearEdge!.maxWidth).toBeLessThan(centred!.maxWidth - 40);
    expect(nearEdge!.right).toBeLessThanOrEqual(nearEdge!.canvasWidth + 1);

    await dragItem(page, longItem, -canvasBox.width * 0.18);
    const returned = await textGeometry(longItem);
    expect(returned).not.toBeNull();
    expect(returned!.maxWidth).toBeGreaterThan(nearEdge!.maxWidth + 40);
    expect(returned!.textBoxWidth).toBe("max-content");
  });

  test("authored newlines and template widths remain intentional while editor and export agree", async ({ page }, testInfo) => {
    test.skip(
      !DESKTOP_PROJECTS.has(testInfo.project.name),
      "DOM export comparison and desktop resize handles"
    );

    await freshCanvas(page);
    const authored = await addText(
      page,
      "An authored first line\nAn authored second line"
    );
    const authoredId = await authored.getAttribute("data-canvas-item-id");
    if (!authoredId) throw new Error("Text id was not rendered.");
    const before = await textGeometry(authored);
    expect(before?.authoredValue).toBe(
      "An authored first line\nAn authored second line"
    );

    const handle = page.getByRole("button", {
      name: "Resize from bottom right",
    });
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error("Resize handle was not rendered.");
    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 70, handleBox.y + 70, { steps: 5 });
    await page.mouse.up();
    const after = await textGeometry(authored);
    expect(after?.authoredValue).toBe(
      "An authored first line\nAn authored second line"
    );
    expect(after?.textBoxWidth).toBe("max-content");
    expect(after!.itemWidth).toBeGreaterThan(before!.itemWidth);

    const parity = await page.evaluate((id) => {
      const live = document.querySelector<HTMLElement>(
        `[data-canvas-text-display="${id}"]`
      );
      const exported = document.querySelector<HTMLElement>(
        `[data-export-text="${id}"]`
      );
      const canvas = document.querySelector<HTMLElement>(
        ".editor-canvas-surface"
      );
      if (!live || !exported || !canvas) return null;
      const scale = canvas.getBoundingClientRect().width / canvas.offsetWidth;
      return {
        liveWidth: live.getBoundingClientRect().width / scale,
        liveHeight: live.getBoundingClientRect().height / scale,
        exportWidth: exported.getBoundingClientRect().width,
        exportHeight: exported.getBoundingClientRect().height,
        liveText: live.innerText,
        exportText: exported.innerText,
      };
    }, authoredId);
    expect(parity).not.toBeNull();
    expect(parity!.liveText).toBe(parity!.exportText);
    expect(Math.abs(parity!.liveWidth - parity!.exportWidth)).toBeLessThan(2);
    expect(Math.abs(parity!.liveHeight - parity!.exportHeight)).toBeLessThan(2);

    await freshCanvas(page);
    await page.getByRole("button", { name: "Templates", exact: true }).first().click();
    await page.getByRole("button", { name: "Use Template", exact: true }).nth(1).click();
    const bounded = page.locator("[data-canvas-text-display]").filter({
      hasText: "Creativity is intelligence having fun.",
    });
    const boundedGeometry = await bounded.evaluate((element) => {
      const item = element.closest<HTMLElement>("[data-canvas-item-id]");
      return item
        ? {
            width: item.offsetWidth,
            styleWidth: item.style.width,
            maxWidth: item.style.maxWidth,
          }
        : null;
    });
    expect(boundedGeometry).not.toBeNull();
    expect(boundedGeometry!.styleWidth).toMatch(/px$/);
    expect(boundedGeometry!.maxWidth).toBe("");
    expect(boundedGeometry!.width).toBeGreaterThan(20);
  });

  test("Chrome caret editor shares the measured text box through representative edits", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "Desktop Chrome", "Chrome caret regression");
    await freshCanvas(page);
    await page.getByRole("button", { name: "Text", exact: true }).first().click();
    await page.getByRole("button", { name: "Add Text", exact: true }).click();
    const editor = page.locator("[data-canvas-text-editor]");
    await editor.fill("Caret geometry");
    await editor.press("Home");
    await expect(editor).toHaveJSProperty("selectionStart", 0);
    await editor.press("End");
    await expect(editor).toHaveJSProperty("selectionStart", 14);
    await editor.pressSequentially(" stays attached");
    await editor.press("ArrowLeft");
    await editor.press("Backspace");
    await editor.press("End");
    await editor.blur();

    const item = page.locator("[data-canvas-item-id]").last();
    const handle = page.getByRole("button", {
      name: "Resize from bottom right",
    });
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error("Resize handle was not rendered.");
    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 35, handleBox.y + 35, { steps: 4 });
    await page.mouse.up();
    await dragItem(page, item, 25);
    await page.getByRole("button", { name: "Open canvas zoom options" }).click();
    await page.getByRole("menuitem", { name: "150%" }).click();
    await item.click();
    await expect(editor).toBeVisible();
    await editor.press("End");

    const geometry = await editor.evaluate((element) => {
      const textarea = element as HTMLTextAreaElement;
      const root = textarea.parentElement;
      const measurement = root?.querySelector<HTMLElement>("span[aria-hidden]");
      if (!root || !measurement) return null;
      const editorRect = textarea.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const style = getComputedStyle(textarea);
      return {
        selectionStart: textarea.selectionStart,
        valueLength: textarea.value.length,
        widthDelta: Math.abs(editorRect.width - rootRect.width),
        heightDelta: Math.abs(editorRect.height - rootRect.height),
        scrollLeft: textarea.scrollLeft,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        measurementWidth: measurement.getBoundingClientRect().width,
      };
    });
    expect(geometry).not.toBeNull();
    expect(geometry!.selectionStart).toBe(geometry!.valueLength);
    expect(geometry!.widthDelta).toBeLessThan(1);
    expect(geometry!.heightDelta).toBeLessThan(2);
    expect(geometry!.scrollLeft).toBe(0);
    expect(geometry!.paddingLeft).toBe("0px");
    expect(geometry!.paddingRight).toBe("0px");
    expect(geometry!.measurementWidth).toBeGreaterThan(0);
  });

  test("growing and shrinking a long sentence preserves the free-form boundary instead of creating a narrow box", async ({ page }, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Desktop resize handles");
    await freshCanvas(page);
    const item = await addText(
      page,
      "nufc are the best club in the world of football and are the richest club in the world"
    );
    const before = await textGeometry(item);
    const growHandle = page.getByRole("button", {
      name: "Resize from bottom right",
    });
    let box = await growHandle.boundingBox();
    if (!box) throw new Error("Resize handle was not rendered.");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 65, box.y + 65, { steps: 6 });
    await page.mouse.up();
    const grown = await textGeometry(item);
    expect(grown).not.toBeNull();
    expect(grown!.textBoxWidth).toBe("max-content");
    expect(grown!.maxWidth).toBeCloseTo(grown!.canvasWidth, 0);
    expect(grown!.itemWidth).toBeGreaterThan(grown!.canvasWidth * 0.8);
    expect(grown!.lineHeight).toBeGreaterThan(before!.lineHeight);
    expect(grown!.itemHeight).toBeGreaterThan(before!.itemHeight);

    box = await growHandle.boundingBox();
    if (!box) throw new Error("Resize handle was not rendered after growth.");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x - 35, box.y - 35, { steps: 6 });
    await page.mouse.up();
    const shrunk = await textGeometry(item);
    expect(shrunk).not.toBeNull();
    expect(shrunk!.textBoxWidth).toBe("max-content");
    expect(shrunk!.itemHeight).toBeLessThan(grown!.itemHeight);
  });
});

test.describe("fit and centre geometry", () => {
  test("mobile starts centred and Fit recentres immediately across representative presets", async ({ page }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.has(testInfo.project.name), "Mobile Fit regression");
    test.setTimeout(90_000);
    await freshCanvas(page);
    await expectCanvasCentred(page);
    await pressMobileFit(page);
    await expectCanvasCentred(page);

    await page.getByRole("button", { name: "Canvas zoom" }).click();
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.waitForTimeout(100);
    await pressMobileFit(page);
    await expectCanvasCentred(page);

    for (const preset of ["A4 Landscape", "Instagram Post", "Portrait"]) {
      await choosePreset(page, preset);
      await page.waitForTimeout(250);
      await pressMobileFit(page);
      await expectCanvasCentred(page);
    }

    const currentViewport = page.viewportSize();
    if (!currentViewport) throw new Error("Viewport size was unavailable.");
    await page.setViewportSize({
      width: Math.min(700, currentViewport.height),
      height: currentViewport.width,
    });
    await page.waitForTimeout(250);
    await pressMobileFit(page);
    await expectCanvasCentred(page);
  });

  test("desktop preset Fit requests retain centred rendered geometry", async ({ page }, testInfo) => {
    test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "Desktop Fit regression");
    await freshCanvas(page);
    await expectCanvasCentred(page);
    for (const preset of ["A4 Landscape", "Instagram Post", "Portrait"]) {
      await choosePreset(page, preset);
      await page.waitForTimeout(250);
      await expectCanvasCentred(page);
    }
  });
});
