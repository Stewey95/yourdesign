import { test, expect } from "@playwright/test";

const PNG_1x1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

test.describe("image and text selection bounds (audit - should already be tight)", () => {
  test("uploaded image: wrapper matches the rendered <img> exactly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await page.getByRole("button", { name: "Media", exact: true }).first().click();
    await page.setInputFiles('input[type="file"]', {
      name: "pixel.png",
      mimeType: "image/png",
      buffer: Buffer.from(PNG_1x1, "base64"),
    });

    const item = page.locator("[data-canvas-item-id]").first();
    await expect(item).toBeVisible();

    const match = await item.evaluate((el) => {
      const wrapperRect = el.getBoundingClientRect();
      const img = el.querySelector("img");
      if (!img) return null;
      const imgRect = img.getBoundingClientRect();
      return {
        dx: Math.abs(wrapperRect.width - imgRect.width),
        dy: Math.abs(wrapperRect.height - imgRect.height),
      };
    });

    expect(match).not.toBeNull();
    expect(match!.dx).toBeLessThan(1);
    expect(match!.dy).toBeLessThan(1);
  });

  test("single-line text: wrapper hugs the rendered glyphs", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await page.getByRole("button", { name: "Text", exact: true }).first().click();
    await page.getByRole("button", { name: "Add Text", exact: true }).click();
    await page.locator("[data-canvas-text-editor]").fill("Hello");
    await page.mouse.click(640, 400); // blur, finish editing

    const item = page.locator("[data-canvas-item-id]").first();
    await expect(item).toBeVisible();

    const box = await item.boundingBox();
    if (!box) throw new Error("text item not found");

    // A tight single-word wrapper should be noticeably narrower than the
    // canvas, not stretched to some arbitrary oversized box.
    expect(box.width).toBeGreaterThan(20);
    expect(box.width).toBeLessThan(300);
    expect(box.height).toBeGreaterThan(10);
    expect(box.height).toBeLessThan(80);
  });

  test("multi-line (wrapped) text: wrapper height grows to fit all lines tightly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create");
    await page.getByRole("button", { name: "Text", exact: true }).first().click();
    await page.getByRole("button", { name: "Add Text", exact: true }).click();

    const longText =
      "This is a much longer piece of text that should wrap across several lines inside the canvas text box";
    const textarea = page.locator("[data-canvas-text-editor]");
    await textarea.fill(longText);

    const item = page.locator("[data-canvas-item-id]").first();
    await expect(item).toBeVisible();

    const box = await item.boundingBox();
    if (!box) throw new Error("text item not found");

    // Multi-line wrapped text must be taller than a single line (proves
    // wrapping/height recalculation still works).
    const singleLineHeightEstimate = 40; // generous upper bound for one line
    expect(box.height).toBeGreaterThan(singleLineHeightEstimate);

    // The wrapper (which drives the selection box) should hug the
    // auto-sized textarea - not include large unexplained empty space
    // below the wrapped lines. A generous tolerance here: textarea vs. its
    // sizing-reference <span> can differ by a few pixels of font-metric
    // rounding that varies per engine (pre-existing, unrelated to this
    // fix's scope - text rendering isn't touched by it), but nothing near
    // the gross, box-doubling padding this sprint is about.
    const textareaBox = await textarea.boundingBox();
    if (!textareaBox) throw new Error("textarea not found");

    expect(Math.abs(box.height - textareaBox.height)).toBeLessThan(
      textareaBox.height * 0.3
    );
  });
});
