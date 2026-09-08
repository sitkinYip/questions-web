import { expect, test } from "@playwright/test";
import { mockQuestionsApi } from "@e2e/fixtures";

test.describe("hidden version archive", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("five taps reveal build details and closing restores focus", async ({
    page,
  }) => {
    await mockQuestionsApi(page);
    await page.goto("/login");
    const trigger = page.getByRole("button", { name: "Questions · 星图" });
    for (let i = 0; i < 4; i++) await trigger.tap();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await trigger.tap();
    const dialog = page.getByRole("dialog", { name: "星图档案" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("v0.0.0-local")).toBeVisible();
    await expect(dialog.getByText("提交坐标")).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath("version-archive.png"),
      animations: "disabled",
    });
    await dialog.getByRole("button", { name: "关闭星图档案" }).tap();
    await expect(dialog).toHaveCount(0);
    for (let i = 0; i < 5; i++) await trigger.tap();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
  test("archive effects never create horizontal scrolling at narrow or short sizes", async ({
    page,
  }) => {
    await mockQuestionsApi(page);
    await page.goto("/login");
    for (let i = 0; i < 5; i++)
      await page.getByRole("button", { name: "Questions · 星图" }).tap();
    const dialog = page.getByRole("dialog", { name: "星图档案" });
    await expect(dialog).toBeVisible();
    for (const size of [
      { width: 390, height: 844 },
      { width: 320, height: 568 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(size);
      for (const time of [0, 400, 900, 1100, 1500]) {
        const sizes = await dialog.evaluate((element, time) => {
          for (const animation of element.getAnimations({ subtree: true })) {
            animation.pause();
            animation.currentTime = time;
          }
          return [
            element,
            element.parentElement!,
            document.documentElement,
          ].map((node) => ({
            width: node.clientWidth,
            scroll: node.scrollWidth,
          }));
        }, time);
        for (const measure of sizes)
          expect(measure.scroll).toBeLessThanOrEqual(measure.width + 1);
      }
      // Short screens must still allow reaching the final detail vertically.
      await dialog.locator(".version-note").scrollIntoViewIfNeeded();
      await expect(dialog.locator(".version-note")).toBeInViewport();
      expect(await dialog.evaluate((element) => element.scrollLeft)).toBe(0);
    }
  });
});
