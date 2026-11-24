import { expect, test } from "@playwright/test";
import { mockStarwardApi, enterGame, login } from "@e2e/fixtures";

test.beforeEach(async ({ page }) => {
  await mockStarwardApi(page);
});

test("follows the device theme and persists a passport appearance override", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await login(page, "/profile");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: /外观/ }).click();
  await page.getByRole("radio", { name: "深色", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: /外观/ }).click();
  await page.getByRole("radio", { name: "跟随系统", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("keeps passport and theme access available when a traveler has no avatar", async ({
  page,
}) => {
  await login(page);
  const passportLink = page.getByRole("link", { name: "打开护照" });
  await expect(passportLink).toBeVisible();
  await expect(passportLink.locator(".player-avatar")).toHaveText("远");
  await passportLink.click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("button", { name: /外观/ })).toBeVisible();
});

test("keeps the dark media viewer legible in light mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await enterGame(page);

  await page.getByRole("button", { name: "查看题目图片 1" }).click();

  const previousButton = page.getByRole("button", { name: "上一张" });
  const nextButton = page.getByRole("button", { name: "下一张" });
  await expect(previousButton).toBeDisabled();
  await expect(previousButton).toHaveCSS("color", "rgb(133, 134, 127)");
  await expect(nextButton).toBeEnabled();
  await expect(nextButton).toHaveCSS("color", "rgb(215, 211, 199)");
});

test("desktop floating topbar switches theme without layout shift and links straight to passport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await login(page);

  const topbar = page.locator(".game-topbar");
  await expect(topbar).toBeVisible();
  await expect(topbar).toHaveCSS("border-radius", "999px");
  const before = await page.locator(".chapter-card").first().boundingBox();

  await page.getByRole("button", { name: "切换浅色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.locator(".chapter-card").first().boundingBox()).toEqual(
    before,
  );

  await page.getByRole("link", { name: "打开护照" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("button", { name: "退出登录" })).toBeVisible();
});

test("quest progress persists after returning via topbar back link and navigating desktop routes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await enterGame(page);
  await page.getByPlaceholder("输入你的答案").fill("星辰大海");
  await page.getByRole("button", { name: "提交答案" }).click();
  const burst = page.getByRole("dialog", { name: "回答正确" });
  await expect(burst).toBeVisible();
  await expect(burst).toContainText("+50 EXP");
  await page.keyboard.press("Escape");
  await expect(burst).toHaveCount(0);
  await expect(page.locator(".quest-card").getByRole("status")).toBeVisible();

  await page.getByRole("link", { name: "返回启程" }).click();
  await expect(page.getByRole("heading", { name: "启程" })).toBeVisible();
  await page.getByRole("link", { name: "打开护照" }).click();
  await expect(page.locator(".player-passport")).toContainText("50");
  await page.getByRole("link", { name: "收藏", exact: true }).click();
  await expect(page.getByRole("heading", { name: "收藏" })).toBeVisible();
  await page.getByRole("link", { name: "启程", exact: true }).click();
  await page.getByRole("link", { name: /星辰探险/ }).click();
  await expect(page).toHaveURL(/\/play\/assignment1$/);
  await expect(page.getByLabel("答题进度")).toHaveText("1/2已完成");
  await page.getByRole("button", { name: /01 已完成/ }).click();
  await expect(page.getByPlaceholder("输入你的答案")).toBeDisabled();
});
