import { expect, test } from "@playwright/test";
import { mockQuestionsApi, pocketBaseList } from "./fixtures";

const navigationLevels = Array.from({ length: 10 }, (_, index) => ({
  id: `navigation-level-${index + 1}`,
  step: index + 11,
  type: "FillInTheBlank",
  title: `导航测试第 ${index + 1} 题`,
  question: [{ text: `请输入第 ${index + 1} 题答案` }],
  answer: `答案${index + 1}`,
  answerList: [],
  options: [],
  thread: [],
  updated: "2026-08-25 10:00:00.000Z",
}));

test.beforeEach(async ({ page }) => {
  await mockQuestionsApi(page);
  await page.route("**/api/collections/levels/records**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(pocketBaseList(navigationLevels)),
    }),
  );
});

test("active tab stays visible and completed quests switch by horizontal swipe", async ({
  page,
}) => {
  const steps = navigationLevels.map((level) => level.step).join(",");
  await page.goto(`/?qas=${steps}&user=e2e-navigation`);

  for (let index = 0; index < 5; index += 1) {
    await page.getByPlaceholder("输入你的答案").fill(`答案${index + 1}`);
    await page.getByPlaceholder("输入你的答案").press("Enter");
    await page.getByRole("button", { name: "前往下一题" }).click();
  }

  await expect(
    page.getByRole("heading", { name: "导航测试第 6 题" }),
  ).toBeVisible();
  await page.waitForTimeout(450);

  const activeTab = page.locator(".quest-nav button.is-active");
  const tabIsVisibleInsideNav = await activeTab.evaluate((tab) => {
    const nav = tab.parentElement;
    if (!nav) return false;
    const tabRect = tab.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    return tabRect.left >= navRect.left && tabRect.right <= navRect.right;
  });
  expect(tabIsVisibleInsideNav).toBe(true);
  expect(
    await page.locator(".quest-nav").evaluate((nav) => nav.scrollLeft),
  ).toBeGreaterThan(0);

  const swipeTarget = page.locator(".quest-meta");
  const box = await swipeTarget.boundingBox();
  if (!box) throw new Error("Quest swipe target is not visible");
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 90, centerY, { steps: 5 });
  await page.mouse.up();
  await expect(
    page.getByRole("heading", { name: "导航测试第 5 题" }),
  ).toBeVisible();

  const previousBox = await page.locator(".quest-meta").boundingBox();
  if (!previousBox)
    throw new Error("Previous quest swipe target is not visible");
  const previousCenterX = previousBox.x + previousBox.width / 2;
  const previousCenterY = previousBox.y + previousBox.height / 2;
  await page.mouse.move(previousCenterX, previousCenterY);
  await page.mouse.down();
  await page.mouse.move(previousCenterX - 90, previousCenterY, { steps: 5 });
  await page.mouse.up();
  await expect(
    page.getByRole("heading", { name: "导航测试第 6 题" }),
  ).toBeVisible();
});
