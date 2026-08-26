import { expect, test } from "@playwright/test";
import { mockQuestionsApi } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockQuestionsApi(page);
});

test("single quest completes, previews media and restores after reload", async ({
  page,
}) => {
  await page.goto("/?qa=11&user=e2e-single");
  await expect(page.getByRole("heading", { name: "星辰之门" })).toBeVisible();

  await page.getByRole("button", { name: "查看题目图片 1" }).click();
  await expect(page.getByRole("dialog", { name: "图片预览" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByPlaceholder("输入你的答案").fill("星辰，大海");
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(page.getByText("全部题目已经完成。")).toBeVisible();
  await expect(page.getByRole("heading", { name: "通关线索" })).toBeVisible();

  await page.reload();
  await expect(page.getByPlaceholder("输入你的答案")).toBeDisabled();
  await expect(page.getByRole("heading", { name: "通关线索" })).toBeVisible();
});

test("multi quest unlocks in order and reveals the combined clue", async ({
  page,
}) => {
  await page.goto("/?qas=11,12&user=e2e-multi");
  await expect(page.getByRole("button", { name: /02/ })).toBeDisabled();
  await page.getByPlaceholder("输入你的答案").fill("星辰大海");
  await page.getByRole("button", { name: "提交答案" }).click();
  await page.getByRole("button", { name: "前往下一题" }).click();
  await page.getByText("北极星").click();
  await page.getByRole("button", { name: "提交答案" }).click();

  await expect(
    page.getByRole("dialog", { name: "组合谜题全部破解" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "查看组合结果" }).click();
  await expect(
    page.getByRole("dialog", { name: "星辰组合真相" }),
  ).toContainText("本场线索已经解锁");
});

test("wrong choice enters a recoverable penalty state", async ({ page }) => {
  await page.goto("/?qa=12&user=e2e-penalty");
  await page.getByText("月亮").click();
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(page.locator('.feedback[data-tone="danger"]')).toBeVisible();
  await expect(page.getByRole("timer")).toContainText("距离再次尝试还有");
  await expect(page.getByRole("button", { name: "提交答案" })).toBeDisabled();
});
