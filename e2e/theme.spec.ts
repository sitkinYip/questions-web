import { expect, test } from "@playwright/test";
import { mockQuestionsApi, enterGame, login } from "@e2e/fixtures";

test.beforeEach(async ({ page }) => {
  await mockQuestionsApi(page);
});

test("follows the device theme and persists an avatar-menu override", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await enterGame(page);

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "打开冒险者菜单" }).click();
  await page.getByRole("radio", { name: "深色", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "打开冒险者菜单" }).click();
  await page.getByRole("radio", { name: "跟随系统", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("keeps theme access available when a traveler has no avatar", async ({
  page,
}) => {
  await login(page);
  await expect(
    page.getByRole("button", { name: "打开冒险者菜单" }),
  ).toBeVisible();
  await expect(page.locator(".traveler-avatar--fallback")).toHaveText("远");
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

test("desktop avatar hover opens an account bubble without moving the question layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterGame(page);
  const avatar = page.getByRole("button", { name: "打开冒险者菜单" });
  await avatar.scrollIntoViewIfNeeded();
  // Reduced motion shortens animations, but the existing card still has an
  // entrance delay. Compare the settled layout, not its initial scaled frame.
  await expect
    .poll(() =>
      page
        .locator(".quest-card")
        .evaluate(
          (card) =>
            card
              .getAnimations()
              .filter(
                (animation) =>
                  animation.effect?.getComputedTiming().iterations !==
                    Infinity && animation.playState !== "finished",
              ).length,
        ),
    )
    .toBe(0);
  const before = await page.locator(".quest-card").boundingBox();
  await expect(page.getByRole("navigation", { name: "个人导航" })).toHaveCount(
    0,
  );
  await avatar.hover();
  const menu = page.getByRole("dialog", { name: "冒险者菜单", exact: true });
  await expect(menu).toBeVisible();
  await expect(page.locator(".ui-sheet-overlay")).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "冒险者护照" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "奇遇收藏" })).toBeVisible();
  await expect(menu.getByRole("radio", { name: "跟随系统" })).toBeChecked();
  await expect(menu).toHaveCSS("border-radius", "18px");
  const logout = menu.getByRole("button", { name: "退出登录" });
  await logout.hover();
  const logoutAlignment = await logout.evaluate((button) => {
    const control = button.getBoundingClientRect();
    const icon = button.querySelector("svg")!.getBoundingClientRect();
    const label = button.querySelector("span")!.getBoundingClientRect();
    const center = control.top + control.height / 2;
    return {
      icon: Math.abs(icon.top + icon.height / 2 - center),
      label: Math.abs(label.top + label.height / 2 - center),
    };
  });
  expect(logoutAlignment.icon).toBeLessThanOrEqual(1);
  expect(logoutAlignment.label).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(avatar).toBeFocused();
  await expect
    .poll(async () => await page.locator(".quest-card").boundingBox())
    .toEqual(before);
});

test("desktop account bubble eases in and finishes its exit before unmounting", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enterGame(page);

  const avatar = page.getByRole("button", { name: "打开冒险者菜单" });
  await avatar.hover();
  const bubble = page.locator(".game-account-popover");
  await expect(bubble).toHaveAttribute("data-state", "open");

  const motion = await bubble.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      properties: style.transitionProperty
        .split(",")
        .map((item) => item.trim()),
      durations: style.transitionDuration
        .split(",")
        .map((item) => Number.parseFloat(item) * 1000),
    };
  });
  expect(motion.properties).toEqual(
    expect.arrayContaining(["opacity", "transform"]),
  );
  expect(Math.max(...motion.durations)).toBeGreaterThanOrEqual(220);

  await page.mouse.move(640, 700);
  await expect(bubble).toHaveAttribute("data-state", "closed");
  await expect(bubble).toHaveCount(0);
});

test("account bubble links navigate to prizes and return to the server-backed question progress", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await enterGame(page);
  await page.getByPlaceholder("输入你的答案").fill("星辰大海");
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(page.locator(".quest-card").getByRole("status")).toBeVisible();
  await page.getByRole("button", { name: "打开冒险者菜单" }).click();
  const menu = page.getByRole("dialog", { name: "冒险者菜单", exact: true });
  await expect(menu.getByText("50 EXP", { exact: true })).toBeVisible();
  await menu.getByRole("link", { name: "奇遇收藏", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "把奇遇，收入囊中。" }),
  ).toBeVisible();
  await expect(menu).toHaveCount(0);
  await page.getByRole("button", { name: "打开冒险者菜单" }).click();
  await menu.getByRole("link", { name: /返回答题/ }).click();
  await expect(page).toHaveURL(/\/play\/assignment1$/);
  await expect(page.getByLabel("答题进度")).toHaveText("1/2已完成");
  await page.getByRole("button", { name: /01 已完成/ }).click();
  await expect(page.getByPlaceholder("输入你的答案")).toBeDisabled();
});
