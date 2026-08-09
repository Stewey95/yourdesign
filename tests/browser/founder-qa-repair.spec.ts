import { test, expect, type Page } from "@playwright/test";

async function openPanel(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).first().click();
}

// Opens the Elements panel, retrying the click once if the panel doesn't
// actually appear - mobile emulation occasionally loses the race against
// React hydration/re-render even after a settle wait, and a fixed sleep
// can't fully rule that out. Also handles mobile's own intentional
// behaviour: inserting an item auto-selects it, which switches the mobile
// sidebar to the per-item style toolbar and closes this panel, so callers
// that need to keep browsing elements after an insert call this again.
async function ensureElementsPanelOpen(page: Page) {
  const searchInput = page.locator('input[placeholder="Search elements..."]');

  if (await searchInput.isVisible().catch(() => false)) return;

  await openPanel(page, "Elements");
  const opened = await searchInput
    .waitFor({ state: "visible", timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (!opened) {
    await openPanel(page, "Elements");
    await searchInput.waitFor({ state: "visible", timeout: 5000 });
  }
}

// Guarantees a known-clean panel state (no leftover search text or active
// category filter) before relying on "See all"/heading text - avoids
// having to fully reverse-engineer the mobile panel's exact
// mount/unmount-on-tool-switch timing.
async function resetToAllElements(page: Page) {
  await ensureElementsPanelOpen(page);
  const searchInput = page.locator('input[placeholder="Search elements..."]');
  if ((await searchInput.inputValue().catch(() => "")) !== "") {
    await searchInput.fill("");
  }
  const clearFilter = page.getByRole("button", { name: "Clear filter" });
  if (await clearFilter.isVisible().catch(() => false)) {
    await clearFilter.click();
  }
}

async function insertElement(page: Page, name: string) {
  await ensureElementsPanelOpen(page);
  const before = await page.locator("[data-canvas-item-id]").count();
  const searchInput = page.locator('input[placeholder="Search elements..."]');
  await searchInput.fill(name);
  await expect(searchInput).toHaveValue(name);

  const addButton = page.getByRole("button", { name: `Add ${name}`, exact: true });
  await expect(addButton).toBeVisible({ timeout: 5000 });
  await addButton.click();

  // Fail fast with a clear signal here rather than letting a silently
  // missed insertion cascade into confusing state further down the test.
  await expect(page.locator("[data-canvas-item-id]")).toHaveCount(before + 1, {
    timeout: 5000,
  });
}

async function freshCanvas(page: Page) {
  await page.goto("/create");
  await page.evaluate(async () => {
    localStorage.clear();
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs.map(
        (db) =>
          new Promise((resolve) => {
            const req = indexedDB.deleteDatabase(db.name ?? "");
            req.onsuccess = req.onerror = req.onblocked = () => resolve(undefined);
          })
      )
    );
  });
  await page.goto("/create");
  // Give the page time to hydrate before the caller interacts with it -
  // without this, clicking a control immediately after goto() races React
  // hydration and silently no-ops on slower mobile emulation (the click
  // lands before the handler is attached), while desktop is fast enough
  // to rarely lose that race.
  await page.waitForTimeout(500);
}

test.describe("Founder QA repair pass - colour correctness", () => {
  // Named regressions from the QA report, plus a few representative
  // elements from the systematic fill-and-stroke promotion.
  const ELEMENTS_TO_CHECK = ["Moon", "Fish", "Sun", "Ice Cream Cone", "Coffee Cup", "Gear"];

  for (const name of ELEMENTS_TO_CHECK) {
    test(`${name}: renders visible paint and never leaks the raw catalog placeholder colour`, async ({ page }) => {
      await freshCanvas(page);
      await insertElement(page, name);

      const item = page.locator("[data-canvas-item-id]").last();
      await expect(item).toBeVisible();

      const info = await item.evaluate((wrapperEl) => {
        const svg = wrapperEl.querySelector("svg");
        if (!svg) return { anyPainted: false, leaksPlaceholder: false };
        const shapes = Array.from(
          svg.querySelectorAll("path, rect, circle, line, polygon, polyline, ellipse")
        );
        const anyPainted = shapes.some((s) => {
          const f = s.getAttribute("fill");
          const st = s.getAttribute("stroke");
          return (f && f !== "none") || (st && st !== "none");
        });
        const leaksPlaceholder = shapes.some((s) => {
          const f = (s.getAttribute("fill") || "").toLowerCase();
          const st = (s.getAttribute("stroke") || "").toLowerCase();
          return f === "#2563eb" || st === "#2563eb";
        });
        return { anyPainted, leaksPlaceholder };
      });

      expect(info.anyPainted).toBe(true);
      expect(info.leaksPlaceholder).toBe(false);
    });
  }

  test("Moon renders as a black-stroked crescent, not a raw blue shape", async ({ page }) => {
    await freshCanvas(page);
    await insertElement(page, "Moon");

    const item = page.locator("[data-canvas-item-id]").last();
    const stroke = await item.evaluate((el) => el.querySelector("path")?.getAttribute("stroke"));
    expect(stroke?.toLowerCase()).toBe("#000000");
  });

  test("Sun and Ice Cream Cone expose a Fill control in the inspector", async ({ page }) => {
    for (const name of ["Sun", "Ice Cream Cone"]) {
      await freshCanvas(page);
      await insertElement(page, name);
      await page.locator("[data-canvas-item-id]").last().click();

      // On mobile, selecting an item shows a compact toolbar with a
      // "Style" button rather than the fill/stroke controls directly -
      // tap it to expand the actual style panel first. No-op on desktop,
      // where the inspector's Fill control is already on screen. The
      // button's accessible name comes from its aria-label ("Style shape"
      // / "Close shape style" once toggled open), not its visible text
      // ("Style"), so match loosely rather than on the exact label.
      // The Fill colour input's aria-label ("Fill colour") is shared by
      // both the always-mounted desktop inspector (hidden off-screen on
      // mobile widths via CSS, not unmounted) and the mobile toolbar, so a
      // plain locator resolves to two DOM matches - the :visible filter
      // narrows it back down to whichever one is actually on screen.
      const styleButton = page.getByRole("button", { name: /style/i });
      const fillInput = page.locator('input[aria-label="Fill colour"]:visible');
      if (await styleButton.isVisible().catch(() => false)) {
        await styleButton.click();
        const revealed = await fillInput
          .waitFor({ state: "visible", timeout: 2000 })
          .then(() => true)
          .catch(() => false);
        if (!revealed) {
          await styleButton.click();
        }
      }

      await expect(fillInput).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Founder QA repair pass - stroke width ceilings", () => {
  const CAPPED_ELEMENTS: [string, number][] = [
    ["Pencil", 8],
    ["Ice Cream Cone", 8],
    ["Dotted Circle Border", 6],
  ];

  for (const [name, expectedMax] of CAPPED_ELEMENTS) {
    test(`${name}: stroke width control is capped at ${expectedMax}px, not the shared 40px max`, async ({ page }) => {
      await freshCanvas(page);
      await insertElement(page, name);
      await page.locator("[data-canvas-item-id]").last().click();

      const strokeWidthInput = page.locator('input[type="number"]').last();
      await expect(strokeWidthInput).toHaveAttribute("max", String(expectedMax));
    });
  }

  test("A simple element (Circle) keeps the full shared 40px stroke width range", async ({ page }) => {
    await freshCanvas(page);
    await insertElement(page, "Circle");
    await page.locator("[data-canvas-item-id]").last().click();

    const strokeWidthInput = page.locator('input[type="number"]').last();
    await expect(strokeWidthInput).toHaveAttribute("max", "40");
  });
});

test.describe("Founder QA repair pass - reselection of thin/open artwork", () => {
  test("Hashtag can be reselected reliably with a click a few px from its stroke, but not from empty space", async ({ page }) => {
    await freshCanvas(page);
    await insertElement(page, "Hashtag");
    await page.waitForTimeout(200);

    const item = page.locator("[data-canvas-item-id]").last();
    const canvasItemId = await item.getAttribute("data-canvas-item-id");

    const isSelected = () =>
      page.locator(`[data-selection-overlay="${canvasItemId}"]`).isVisible();

    // page.mouse.click() always synthesizes pointerType "mouse" (confirmed:
    // page.touchscreen.tap() doesn't reach the app's selection handling at
    // all here, likely due to the tap-vs-drag gesture gating this project
    // protects - see AGENTS.md), so this exercises the app's 2px desktop
    // hit-test tolerance on every project regardless of device emulation.
    //
    // The deselect point is derived from the actual canvas surface's own
    // bounding box (".editor-canvas-surface"), not a viewport-relative
    // guess - a guess like "85% across the viewport" can land in the dark
    // gap between the canvas and the desktop side panel (confirmed via a
    // debug screenshot: that gap is neither the canvas nor the panel, so a
    // click there does nothing and the item stays selected from before).
    const deselect = async () => {
      const canvasSurfaceBox = await page.locator(".editor-canvas-surface").boundingBox();
      if (!canvasSurfaceBox) throw new Error("no canvas surface bounding box");
      await page.mouse.click(
        canvasSurfaceBox.x + canvasSurfaceBox.width * 0.97,
        canvasSurfaceBox.y + canvasSurfaceBox.height * 0.97
      );
    };

    // Re-measured after every deselect rather than once up front: on
    // mobile, deselecting collapses the per-item toolbar, which reflows
    // the canvas and shifts the item's on-screen position - a stale
    // pre-deselect box sent clicks meant for the item's stroke straight
    // into empty canvas background instead (confirmed by tracing the
    // native event target, which landed on the canvas surface DIV, not
    // the item's SVG).
    const currentBox = async () => {
      const box = await item.boundingBox();
      if (!box) throw new Error("no bounding box");
      return box;
    };

    await deselect();
    await page.waitForTimeout(150);
    {
      // Vertical line sits at viewBox x=36 within a [9,91] rendered viewBox
      // (geometryBounds x:12 inflated by half the 6px stroke width).
      const box = await currentBox();
      const scale = box.width / 82;
      const lineScreenX = box.x + (36 - 9) * scale;
      const centerScreenY = box.y + box.height / 2;
      await page.mouse.click(lineScreenX - 2, centerScreenY); // a few px off the line
    }
    // expect.poll rather than a fixed wait + single check: under heavier
    // parallel-project load the selection ring class lands correctly but
    // sometimes a beat after 150ms, which was previously misread as a
    // real reselection failure (confirmed via screenshot: the item was
    // visibly selected at the moment the single-shot check had already
    // failed).
    await expect.poll(isSelected, { timeout: 5000 }).toBe(true);

    await deselect();
    await page.waitForTimeout(150);
    {
      const box = await currentBox();
      const cornerX = box.x + box.width * 0.06;
      const cornerY = box.y + box.height * 0.06;
      await page.mouse.click(cornerX, cornerY); // genuinely empty corner
    }
    await expect.poll(isSelected, { timeout: 2000 }).toBe(false);
  });
});

test.describe("Founder QA repair pass - Recents and Favourites", () => {
  test("Recents and Favourites headings are not clipped, and each opens a full browsing view", async ({ page }) => {
    await freshCanvas(page);
    await insertElement(page, "Briefcase");
    // Inserting auto-selects the item, which on mobile swaps this panel
    // for the per-item style toolbar - reopen it before continuing.
    await resetToAllElements(page);

    const recentHeader = page.locator("text=Recent").first();
    await expect(recentHeader).toBeVisible();
    const favHeader = page.locator("text=Favourites").first();
    await expect(favHeader).toBeVisible();

    // Not clipped: the full word renders without a shrunk/ellipsised width.
    const recentBox = await recentHeader.boundingBox();
    expect(recentBox && recentBox.width).toBeGreaterThan(30);

    const seeAllRecent = page.getByRole("button", { name: "See all Recent", exact: true });
    await expect(seeAllRecent).toBeVisible();

    await seeAllRecent.click();
    await expect(page.locator("#element-results-heading")).toContainText("Recent");
    // Scoped to the full card specifically (aria-label), not the tiny
    // title-only quick-insert thumbnails that stay visible up top too.
    await expect(page.getByLabel("Add Briefcase", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Back to all elements" }).click();
    await expect(page.locator("#element-results-heading")).not.toContainText("Recent");
  });

  test("Favouriting from the expanded Recents view works and shows up in Favourites", async ({ page }) => {
    await freshCanvas(page);
    await insertElement(page, "Briefcase");
    await resetToAllElements(page);

    await page.getByRole("button", { name: "See all Recent", exact: true }).click();

    const card = page.locator("[role='button'][aria-label='Add Briefcase']");
    await card.locator("button[aria-label*='favourites']").click();

    await page.getByRole("button", { name: "Back to all elements" }).click();
    await page.getByRole("button", { name: "See all Favourites", exact: true }).click();
    await expect(page.locator("#element-results-heading")).toContainText("Favourites");
    await expect(page.getByLabel("Add Briefcase", { exact: true })).toBeVisible();
  });
});

test.describe("Founder QA repair pass - favourite control visibility", () => {
  test("the favourite star is visible without hovering (not opacity-0) and has a real tap target", async ({ page }) => {
    await freshCanvas(page);
    await ensureElementsPanelOpen(page);
    await page.locator('input[placeholder="Search elements..."]').fill("Briefcase");
    await page.waitForTimeout(150);

    const card = page.locator("[role='button'][aria-label='Add Briefcase']");
    const star = card.locator("button[aria-label*='favourites']");
    await expect(star).toBeVisible();

    const opacity = await star.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0.9);

    const box = await star.boundingBox();
    expect(box && box.width).toBeGreaterThanOrEqual(20);
    expect(box && box.height).toBeGreaterThanOrEqual(20);

    // Keyboard accessible: focusable and toggles on Enter.
    await star.focus();
    await expect(star).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(star).toHaveAttribute("aria-pressed", "true");
  });
});
