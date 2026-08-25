import { expect, test } from "@playwright/test";
import { levels, mockQuestionsApi, pocketBaseList } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockQuestionsApi(page);
  await page.route("**/api/collections/levels/records**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        pocketBaseList([
          { ...levels[0], mainAudio: "https://assets.example/bgm.mp3" },
        ]),
      ),
    }),
  );
  await page.route("https://assets.example/bgm.mp3", (route) =>
    route.fulfill({ status: 200, contentType: "audio/mpeg", body: "" }),
  );
});

test("music control stays fixed, drags without toggling and restores position", async ({
  page,
}) => {
  await page.goto("/?qa=11&user=e2e-music-float");
  const control = page.locator(".bgm-control");
  await expect(control).toBeVisible();
  await expect(control).toHaveCSS("position", "fixed");
  const initialPressed = await control.getAttribute("aria-pressed");
  expect(initialPressed).toMatch(/true|false/);
  await expect(
    control.locator(
      initialPressed === "true" ? ".bgm-pause-glyph" : ".bgm-play-glyph",
    ),
  ).toBeVisible();

  const initialBox = await control.boundingBox();
  if (!initialBox) throw new Error("Music control is not visible");
  expect(initialBox.y + initialBox.height).toBeLessThanOrEqual(
    page.viewportSize()?.height ?? Number.POSITIVE_INFINITY,
  );

  await page.mouse.move(
    initialBox.x + initialBox.width / 2,
    initialBox.y + initialBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(96, 136, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(380);

  await expect(control).toHaveAttribute(
    "aria-pressed",
    initialPressed ?? "false",
  );
  const draggedBox = await control.boundingBox();
  if (!draggedBox) throw new Error("Dragged music control is not visible");
  expect(draggedBox.x).toBeLessThan(initialBox.x);
  expect(draggedBox.y).toBeLessThan(initialBox.y);
  expect(draggedBox.x).toBeLessThanOrEqual(14);

  const storedPosition = await page.evaluate(() => {
    const value = window.localStorage.getItem("questions:v1:bgm");
    return value ? JSON.parse(value).position : null;
  });
  expect(storedPosition).toEqual({
    x: 0,
    y: expect.any(Number),
  });

  await page.reload();
  await expect(control).toBeVisible();
  const restoredBox = await control.boundingBox();
  if (!restoredBox) throw new Error("Restored music control is not visible");
  expect(Math.abs(restoredBox.x - draggedBox.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(restoredBox.y - draggedBox.y)).toBeLessThanOrEqual(2);

  await page.evaluate(() => {
    document.body.style.minHeight = "200vh";
    window.scrollTo(0, document.body.scrollHeight);
  });
  const scrolledBox = await control.boundingBox();
  if (!scrolledBox) throw new Error("Fixed music control is not visible");
  expect(Math.abs(scrolledBox.y - restoredBox.y)).toBeLessThanOrEqual(1);
});
