import { expect, test } from "@playwright/test";
import { mockQuestionsApi } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockQuestionsApi(page);
});

test("opens the in-app Bless experience and returns to qa=42", async ({
  page,
}) => {
  await page.goto("/bless?from=final&returnTo=%2F%3Fqa%3D42");

  await expect(
    page.getByRole("button", { name: "点击开启你的专属星空" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "返回冒险" })).toHaveAttribute(
    "href",
    "/?qa=42",
  );

  await page.getByRole("button", { name: "点击开启你的专属星空" }).click();
  await expect(page.getByRole("button", { name: /背景音乐/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "星空谢幕" })).toBeVisible({
    timeout: 3_000,
  });

  await page.getByRole("link", { name: "返回冒险" }).click();
  await expect(page).toHaveURL(/\/\?qa=42$/);
});

test("rejects an external Bless return target", async ({ page }) => {
  await page.goto(
    "/bless?from=final&returnTo=https%3A%2F%2Fevil.example%2Fescape",
  );
  await expect(page.getByRole("link", { name: "返回冒险" })).toHaveCount(0);
});

test("recognizes Bless when a root build is served below questions-next", async ({
  page,
}) => {
  await page.goto(
    "/questions-next/bless?from=final&returnTo=%2Fquestions-next%2F%3Fqa%3D52",
  );

  await expect(
    page.getByRole("button", { name: "点击开启你的专属星空" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "返回冒险" })).toHaveAttribute(
    "href",
    "/questions-next/?qa=52",
  );
  await expect(
    page.getByRole("heading", { name: "没有找到对应题目" }),
  ).toHaveCount(0);
});
