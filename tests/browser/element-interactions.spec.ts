import { test, expect } from "@playwright/test";

test.describe("element interactions remain correct after tight-bounds fix", () => {
  test("dragging a tightly-bounded element moves it correctly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await page.getByRole("button", { name: "Elements", exact: true }).first().click();
    await page
      .getByRole("button", { name: "Add Rectangle", exact: true })
      .click();

    const item = page.locator("[data-canvas-item-id]").first();
    await expect(item).toBeVisible();

    const before = await item.boundingBox();
    if (!before) throw new Error("item not found");
    const startX = before.x + before.width / 2;
    const startY = before.y + before.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 120, startY + 80, { steps: 12 });
    await page.mouse.up();

    const after = await item.boundingBox();
    if (!after) throw new Error("item not found after drag");

    const dx = after.x - before.x;
    const dy = after.y - before.y;

    // Should track the drag closely (100% zoom, so ~1:1 with mouse delta).
    expect(Math.abs(dx - 120)).toBeLessThan(5);
    expect(Math.abs(dy - 80)).toBeLessThan(5);
  });

  test("undo/redo works after inserting a tightly-bounded element", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await page.getByRole("button", { name: "Elements", exact: true }).first().click();
    await page
      .getByRole("button", { name: "Add Heart", exact: true })
      .click();

    await expect(page.locator("[data-canvas-item-id]")).toHaveCount(1);

    await page.keyboard.press("ControlOrMeta+z");
    await expect(page.locator("[data-canvas-item-id]")).toHaveCount(0);

    await page.keyboard.press("ControlOrMeta+Shift+z");
    await expect(page.locator("[data-canvas-item-id]")).toHaveCount(1);
  });

  test("resize via corner handle keeps the wrapper matching the artwork (Circle)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await page.getByRole("button", { name: "Elements", exact: true }).first().click();
    await page
      .getByRole("button", { name: "Add Circle", exact: true })
      .click();

    const item = page.locator("[data-canvas-item-id]").first();
    const before = await item.boundingBox();
    if (!before) throw new Error("item not found");

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
      handleBox.x + handleBox.width / 2 + 100,
      handleBox.y + handleBox.height / 2 + 100,
      { steps: 10 }
    );
    await page.mouse.up();

    const after = await item.boundingBox();
    if (!after) throw new Error("item not found after resize");

    expect(after.width).toBeGreaterThan(before.width * 1.3);

    // After resize, the SVG must still exactly fill the wrapper (viewBox
    // crop + preserveAspectRatio="none" tracks any size).
    const svgFillsWrapper = await item.evaluate((el) => {
      const wrapperRect = el.getBoundingClientRect();
      const svg = el.querySelector("svg");
      if (!svg) return false;
      const svgRect = svg.getBoundingClientRect();
      return (
        Math.abs(svgRect.width - wrapperRect.width) < 1 &&
        Math.abs(svgRect.height - wrapperRect.height) < 1
      );
    });
    expect(svgFillsWrapper).toBe(true);
  });
});
