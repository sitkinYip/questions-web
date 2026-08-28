import { expect, test } from "@playwright/test";
import { mockQuestionsApi, enterGame } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockQuestionsApi(page);
});

test("visual identity fields render and media dialog restores keyboard focus", async ({
  page,
  browserName,
}) => {
  await enterGame(page);

  await expect(page.locator(".traveler-name")).toHaveText("远航者");
  await expect(page.locator(".quest-background")).toHaveCSS(
    "background-image",
    /background\.svg/,
  );
  await expect(page.locator(".quest-atmosphere")).toBeVisible();

  const mediaButton = page.getByRole("button", { name: "查看题目图片 1" });
  await mediaButton.focus();
  await mediaButton.press("Enter");
  const closeButton = page.getByRole("button", { name: "关闭媒体预览" });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.getByRole("button", { name: "下一张" })).toBeFocused();
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(mediaButton).toBeFocused();
});

test("answer flow works with keyboard and interactive targets meet touch size", async ({
  page,
}) => {
  await enterGame(page);
  const answer = page.getByPlaceholder("输入你的答案");
  await answer.focus();
  await answer.fill("星辰大海");
  await answer.press("Enter");
  await expect(page.locator(".quest-card").getByRole("status")).toBeVisible();

  const mediaButton = page.getByRole("button", { name: "查看题目图片 1" });
  const box = await mediaButton.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test("reduced motion preference collapses decorative animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterGame(page);

  const durationSeconds = await page.evaluate(() => {
    const element = document.createElement("div");
    element.className = "rank-up-orbit";
    document.body.append(element);
    const duration = Number.parseFloat(
      window.getComputedStyle(element).animationDuration,
    );
    element.remove();
    return duration;
  });
  expect(durationSeconds).toBeLessThanOrEqual(0.001);
  await expect(page.locator(".quest-atmosphere__motes")).toHaveCSS(
    "display",
    "none",
  );
});
