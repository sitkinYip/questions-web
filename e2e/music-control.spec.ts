import { expect, test } from "@playwright/test";
import {
  mockLegacyAudioPlayback,
  mockQuestionsApi,
  enterGame,
} from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockQuestionsApi(page, { bgm: true });
});

test("loads and toggles music when play returns undefined", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockLegacyAudioPlayback(page);
  await enterGame(page);
  // The restored first-visit answer guide has priority over floating controls.
  await page.getByRole("button", { name: "知道了", exact: true }).click();

  const control = page.locator(".bgm-control");
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await control.click();
  await expect(control).toHaveAttribute("aria-pressed", "false");
  await control.click();
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Unexpected Application Error!")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("music control stays fixed, drags without toggling and restores position", async ({
  page,
}) => {
  await enterGame(page);
  await page.getByRole("button", { name: "知道了", exact: true }).click();
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

test("autoplay hint keeps readable horizontal text on a narrow screen", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: () => Promise.reject(new DOMException("Autoplay blocked")),
    });
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await enterGame(page);

  const hint = page.locator(".bgm-auth-hint");
  const title = hint.locator(".ui-toast__title");
  const action = hint.getByRole("button", { name: "开启背景音乐" });
  await expect(hint).toBeVisible();
  await expect(title).toHaveCSS("white-space", "nowrap");
  await expect(action).toHaveCSS("white-space", "nowrap");

  const hintBox = await hint.boundingBox();
  const actionBox = await action.boundingBox();
  if (!hintBox || !actionBox) throw new Error("Music hint is not visible");
  expect(hintBox.width).toBeLessThanOrEqual(332);
  expect(hintBox.height).toBeLessThan(150);
  expect(actionBox.width).toBeGreaterThan(hintBox.width - 32);
});
