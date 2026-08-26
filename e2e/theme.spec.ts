import { expect, test } from "@playwright/test";
import { mockQuestionsApi } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockQuestionsApi(page);
});

test("follows the device theme and persists an avatar-menu override", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/?qa=11&user=e2e-theme");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: /切换主题/ }).click();
  await page.getByRole("menuitemradio", { name: /^深色/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: /切换主题/ }).click();
  await page.getByRole("menuitemradio", { name: /^跟随系统/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("uses a query theme as the initial override and keeps manual switching available", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({ version: 1, preference: "dark" }),
    );
  }, "questions:v1:theme");
  await page.goto("/?qa=11&user=e2e-query-theme&theme=light");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: /切换主题/ }).click();
  await page.getByRole("menuitemradio", { name: /^深色/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("keeps theme access available when a traveler has no avatar", async ({
  page,
}) => {
  await page.goto("/?qa=12&user=e2e-theme-fallback");
  await expect(page.getByRole("button", { name: /切换主题/ })).toBeVisible();
  await expect(page.locator(".traveler-avatar--fallback")).toHaveText("e");
});

test("keeps the dark media viewer legible in light mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/?qa=11&user=e2e-media-theme");

  await page.getByRole("button", { name: "查看题目图片 1" }).click();

  const previousButton = page.getByRole("button", { name: "上一张" });
  const nextButton = page.getByRole("button", { name: "下一张" });
  await expect(previousButton).toBeDisabled();
  await expect(previousButton).toHaveCSS("color", "rgb(133, 134, 127)");
  await expect(nextButton).toBeEnabled();
  await expect(nextButton).toHaveCSS("color", "rgb(215, 211, 199)");
});

test("renders the letter clue as warm paper in light mode", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/?qa=11&user=e2e-letter-theme");

  await page.getByPlaceholder("输入你的答案").fill("星辰大海");
  await page.getByRole("button", { name: "提交答案" }).click();

  const letterCard = page.locator(".clue-card-letter");
  await expect(letterCard).toBeVisible();
  await expect(letterCard).toHaveCSS("background-color", "rgb(247, 239, 230)");
  await expect(letterCard.locator("mark")).toHaveCSS(
    "background-color",
    "rgba(166, 132, 61, 0.17)",
  );
});
