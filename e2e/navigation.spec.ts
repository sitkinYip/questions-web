import { expect, test } from "@playwright/test";
import { mockQuestionsApi, enterGame } from "@e2e/fixtures";

test("next question scrolls into view after an autoplay clue closes", async ({
  page,
}) => {
  await mockQuestionsApi(page, { autoNext: true, autoClue: true });
  await enterGame(page);
  await page.getByPlaceholder("输入你的答案").fill("星辰大海");
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(
    page.getByRole("dialog", { name: "星辰组合真相" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "关闭线索" }).click();
  await expect(
    page.getByRole("heading", { name: "守门人的选择" }),
  ).toBeVisible();
  await expect(page.locator(".quest-card")).toBeFocused();
});

test("active tab stays visible and completed questions remain swipeable", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockQuestionsApi(page, { count: 10 });
  await enterGame(page);
  for (let index = 0; index < 5; index++) {
    await page.getByPlaceholder("输入你的答案").fill("星辰大海");
    await page.getByRole("button", { name: "提交答案" }).click();
    await page.getByRole("button", { name: "前往下一题" }).click();
    // Let the original delayed card positioning finish before typing again.
    await expect(page.locator(".quest-card")).toBeFocused();
  }
  await expect(
    page.getByRole("heading", { name: "导航测试第 6 题" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.locator(".quest-nav button.is-active").evaluate((tab) => {
        const box = tab.getBoundingClientRect(),
          parent = tab.parentElement!.getBoundingClientRect();
        return box.left >= parent.left - 1 && box.right <= parent.right + 1;
      }),
    )
    .toBe(true);
  await expect(page.locator(".quest-card")).toBeFocused();
  const box = await page.locator(".quest-meta").boundingBox();
  if (!box) throw new Error("Swipe target is missing");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(
    page.getByRole("heading", { name: "导航测试第 5 题" }),
  ).toBeVisible();
});
