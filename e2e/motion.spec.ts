import { expect, test } from "@playwright/test";
import { sampleExit } from "@e2e/motion-sampling";

for (const width of [390, 1366]) {
  for (const label of [
    "奖品详情",
    "左侧导航",
    "文字线索",
    "组合线索",
    "等级提升",
    "完成反馈",
    "通知",
    "媒体",
  ]) {
    test(`${label}: complete enter/exit at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/e2e/preview.html?theme=dark&screen=/motion");
      const trigger = page.getByRole("button", { name: label, exact: true });
      await trigger.click();
      const surface = page.locator('[data-motion-surface][data-state="open"]');
      await expect(surface).toBeVisible();
      const placement =
        label === "奖品详情"
          ? width < 1100
            ? "bottom"
            : "right"
          : label === "左侧导航"
            ? "left"
            : "center";
      await expect(surface).toHaveAttribute("data-placement", placement);
      await expect
        .poll(() =>
          surface.evaluate((el) => getComputedStyle(el).animationName),
        )
        .toBe("motion-surface-enter");
      await surface.evaluate(async (el) => {
        await Promise.all(
          el
            .getAnimations()
            .map((animation) => animation.finished.catch(() => {})),
        );
      });
      if (label === "奖品详情")
        await page.screenshot({ path: `/tmp/motion-reward-${width}.png` });
      // Sample a real exit midway, before allowing DOM removal. No reduced-motion shortcut.
      const sample = await surface.evaluate(sampleExit, null);
      await test.info().attach("exit-frame.json", {
        body: JSON.stringify({ label, width, placement, sample }),
        contentType: "application/json",
      });
      expect(sample).not.toBeNull();
      expect(sample.state).toBe("closed");
      expect(sample.connected).toBe(true);
      expect(sample.opacity).toBeGreaterThan(0);
      expect(sample.opacity).toBeLessThan(1);
      if (placement === "bottom") {
        expect(sample.y).toBeGreaterThan(0);
        expect(Math.abs(sample.x)).toBeLessThan(1);
      }
      if (placement === "right") {
        expect(sample.x).toBeGreaterThan(0);
        expect(Math.abs(sample.y)).toBeLessThan(1);
      }
      if (placement === "left") expect(sample.x).toBeLessThan(0);
      await page
        .locator('[data-motion-surface][data-state="closed"]')
        .evaluateAll((elements) =>
          elements.forEach((el) =>
            el.getAnimations().forEach((a) => a.finish()),
          ),
        );
      await expect(page.locator("[data-motion-overlay]")).toHaveCount(0);
      await expect(trigger).toBeFocused();
      expect(
        await page.evaluate(() => document.body.style.pointerEvents),
      ).not.toBe("none");
    });
  }
}

test("nested media restores reward scroll and repeated close/open never leaks overlays", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/e2e/preview.html?theme=dark&screen=/motion");
  const trigger = page.getByRole("button", { name: "奖品详情", exact: true });
  await trigger.click();
  const body = page.locator(".ui-sheet__body");
  await page
    .getByRole("button", { name: "放大查看图片" })
    .scrollIntoViewIfNeeded();
  const scroll = await body.evaluate((el) => el.scrollTop);
  await page.getByRole("button", { name: "放大查看图片" }).click();
  await expect(page.locator(".media-viewer")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".media-viewer")).toHaveCount(0);
  await expect(page.locator(".ui-sheet")).toBeVisible();
  expect(await body.evaluate((el) => el.scrollTop)).toBe(scroll);
  await expect(
    page.getByRole("button", { name: "放大查看图片" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-motion-overlay]")).toHaveCount(0);
  for (let index = 0; index < 5; index++) {
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-motion-overlay]")).toHaveCount(0);
  }
});

test("reduced motion closes immediately and breakpoint changes use the same placement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/e2e/preview.html?theme=light&screen=/motion");
  await page.getByRole("button", { name: "奖品详情", exact: true }).click();
  const surface = page.locator("[data-motion-surface]");
  await expect(surface).toHaveAttribute("data-placement", "bottom");
  expect(
    await surface.evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.setViewportSize({ width: 1366, height: 844 });
  await expect(surface).toHaveAttribute("data-placement", "right");
  await page.keyboard.press("Escape");
  await expect(surface).toHaveCount(0);
});

for (const width of [390, 1366]) {
  test(`letter closing retains the page until exit at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/e2e/preview.html?screen=/letter&theme=dark");
    await page.locator(".letter-envelope").click();
    await expect(page.locator(".letter-reader")).toBeVisible();
    const text = await page
      .locator(".letter-reader")
      .evaluate(sampleExit, "收起");
    expect(text.state).toBe("closed");
    expect(text.connected).toBe(true);
    expect(text.after).toBe(text.before);
    await page
      .locator(".letter-reader")
      .evaluateAll((elements) =>
        elements.forEach((el) => el.getAnimations().forEach((a) => a.finish())),
      );
    await expect(page.locator(".letter-reader")).toHaveCount(0);
    await expect(page.locator(".letter-envelope")).toBeVisible();
  });
}
