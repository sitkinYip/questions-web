import { expect, test } from "@playwright/test";
import { mockQuestionsApi } from "./fixtures";

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
});
