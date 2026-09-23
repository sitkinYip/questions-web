import { expect, test } from "@playwright/test";
import { visibleBox } from "@e2e/layout-assertions";

for (const theme of ["light", "dark"]) {
  for (const viewport of [
    { width: 740, height: 320 },
    { width: 844, height: 390 },
    { width: 1366, height: 300 },
  ]) {
    test(`${theme} workspace remains reachable at ${viewport.width}x${viewport.height}`, async ({
      page,
      browserName,
      isMobile,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const screen of ["/", "/notifications"]) {
        await page.setViewportSize(viewport);
        await page.goto(`/e2e/preview.html?theme=${theme}&screen=${screen}`);
        const shell = page.locator(".game-shell");
        const panel = page.getByRole("tabpanel");
        await expect(shell).toHaveAttribute("data-workspace-fallback", "");
        expect((await visibleBox(panel)).height).toBeGreaterThanOrEqual(180);
        const last = panel
          .locator(screen === "/" ? ".chapter-card" : ".notification-letter")
          .last();
        await expect(last).toBeVisible();
        const header = await visibleBox(page.locator(".game-topbar"));
        await expect(shell).toHaveCSS("overflow-y", "auto");
        if (browserName === "webkit" && isMobile) {
          // Mobile WebKit does not implement Playwright mouse.wheel.
          await last.scrollIntoViewIfNeeded();
        } else {
          await shell.hover();
          await page.mouse.wheel(0, 3000);
        }
        await expect
          .poll(() => shell.evaluate((el) => el.scrollTop))
          .toBeGreaterThan(0);
        await expect(last).toBeInViewport();
        expect((await visibleBox(page.locator(".game-topbar"))).y).toBe(
          header.y,
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight,
          ),
        ).toBe(true);
        await page.screenshot({
          path: test
            .info()
            .outputPath(`${screen === "/" ? "lobby" : "inbox"}.png`),
        });

        // Rotation back must restore the original pane owner and usable navigation.
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(shell).not.toHaveAttribute("data-workspace-fallback");
        await expect(page.getByRole("tablist")).toBeInViewport();
        expect((await visibleBox(panel)).height).toBeGreaterThan(200);
        await panel.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        await expect(last).toBeInViewport();
        expect(await shell.evaluate((el) => el.scrollTop)).toBe(0);
      }
    });
  }
}
