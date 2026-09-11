import { expect, test } from "@playwright/test";
import { fulfillJson, login, mockQuestionsApi } from "@e2e/fixtures";
import { makeRewards } from "@/test/game-fixtures";
import { visibleBox } from "@e2e/layout-assertions";

for (const width of [390, 1366]) {
  test(`workspace retains navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 768 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/e2e/preview.html?theme=dark");
    const tabs = page.getByRole("tablist");
    await expect(tabs).toHaveAttribute(
      "aria-orientation",
      width >= 1100 ? "vertical" : "horizontal",
    );
    const top = await visibleBox(tabs);
    await expect(page.getByRole("tabpanel")).toBeVisible();
    await page.getByRole("tabpanel").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    expect((await visibleBox(tabs)).y).toBe(top.y);
    await expect(page.locator(".game-topbar")).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    if (width >= 1100) {
      const cards = page.locator(".chapter-card");
      expect((await visibleBox(cards.nth(1))).x).toBeGreaterThan(
        (await visibleBox(cards.first())).x,
      );
    }
  });
}

test("long reward instructions stay in details and media restores the details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockQuestionsApi(page);
  const rewards = makeRewards();
  rewards[0].snapshot.publicInstructions =
    "领取说明 ".repeat(400) + "{{/e2e/assets/question-landscape.svg}}";
  await page.route("**/api/questions/v1/rewards", (route) =>
    fulfillJson(route, { items: rewards }),
  );
  await login(page, "/rewards");
  expect(
    (await visibleBox(page.locator(".reward-card").first())).height,
  ).toBeLessThan(260);
  await page.getByRole("button", { name: "查看星辰纪念章详情" }).click();
  await page.getByRole("button", { name: "放大查看图片" }).last().click();
  await expect(page.locator(".media-viewer-stage--zoom")).toBeVisible();
  await page.getByRole("button", { name: "关闭媒体预览" }).click();
  await expect(page.locator(".reward-details")).toBeVisible();
});

for (const width of [390, 1100, 1366, 1920]) {
  test(`inbox content aligns with its navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 768 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/e2e/preview.html?theme=dark&screen=/notifications");
    await expect(page.locator(".notification-letter").first()).toBeVisible();
    const tabs = page.getByRole("tablist");
    await expect(tabs).toHaveAttribute(
      "aria-orientation",
      width >= 1100 ? "vertical" : "horizontal",
    );
    for (const name of ["旅途来信", "星海信笺", "旅途来信"]) {
      const tab = page.getByRole("tab", { name: new RegExp(name) });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      // A generic tabpanel may still resolve to the departing pane after click.
      // Wait for this tab's own panel, not whichever panel happens to be visible.
      const panel = page.getByRole("tabpanel", { name: new RegExp(name) });
      await expect(panel).toHaveAttribute("data-state", "active");
      const navigation = await visibleBox(tabs);
      const content = await visibleBox(panel);
      if (width >= 1100) {
        expect(content.x).toBeGreaterThanOrEqual(
          navigation.x + navigation.width,
        );
        expect(Math.abs(content.y - navigation.y)).toBeLessThan(2);
        expect(content.width).toBeGreaterThan(navigation.width * 2);
      } else {
        expect(content.y).toBeGreaterThanOrEqual(
          navigation.y + navigation.height,
        );
      }
      expect(content.height).toBeGreaterThan(200);
      await panel.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      expect((await visibleBox(tabs)).y).toBe(navigation.y);
      await expect(page.locator(".game-topbar")).toBeInViewport();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true);
    }
  });
}
