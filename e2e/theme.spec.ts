import { expect, test } from "@playwright/test";
import { mockQuestionsApi, enterGame, login } from "./fixtures";

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

test("avatar sidebar contains account actions and closes back to the unchanged question layout", async ({
  page,
}) => {
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
  await avatar.click();
  const sidebar = page.getByRole("dialog", { name: "冒险者菜单", exact: true });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "冒险者护照" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "奇遇收藏" })).toBeVisible();
  await expect(sidebar.getByRole("radio", { name: "跟随系统" })).toBeChecked();
  await expect(
    sidebar.getByRole("button", { name: "关闭冒险者菜单" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sidebar).toHaveCount(0);
  await expect(avatar).toBeFocused();
  await expect
    .poll(async () => await page.locator(".quest-card").boundingBox())
    .toEqual(before);
});

test("sidebar links navigate to prizes and return to the server-backed question progress", async ({
  page,
}) => {
  await enterGame(page);
  await page.getByPlaceholder("输入你的答案").fill("星辰大海");
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(page.locator(".quest-card").getByRole("status")).toBeVisible();
  await page.getByRole("button", { name: "打开冒险者菜单" }).click();
  const sidebar = page.getByRole("dialog", { name: "冒险者菜单", exact: true });
  await expect(sidebar.getByText("50 EXP", { exact: true })).toBeVisible();
  await sidebar.getByRole("link", { name: "奇遇收藏", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "把奇遇，收入囊中。" }),
  ).toBeVisible();
  await expect(sidebar).toHaveCount(0);
  await page.getByRole("button", { name: "打开冒险者菜单" }).click();
  await sidebar.getByRole("link", { name: /返回答题/ }).click();
  await expect(page).toHaveURL(/\/play\/assignment1$/);
  await expect(page.getByLabel("答题进度")).toHaveText("1/2已完成");
  await page.getByRole("button", { name: /01 已完成/ }).click();
  await expect(page.getByPlaceholder("输入你的答案")).toBeDisabled();
});
