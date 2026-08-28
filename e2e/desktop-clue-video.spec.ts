import { expect, test } from "@playwright/test";
import { login, mockQuestionsApi } from "./fixtures";
import { desktopAssignment, desktopVideoClue } from "./desktop-preview-data";

for (const theme of ["light", "dark"] as const) {
  test(`desktop video clue is one aligned in-page action in ${theme} mode`, async ({
    page,
    context,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 720 });
    const { assignment } = await mockQuestionsApi(page);
    Object.assign(assignment, structuredClone(desktopAssignment), {
      id: "assignment1",
      player: "playeralice",
      clues: [structuredClone(desktopVideoClue)],
    });
    // Exercise the viewer request without relying on a third-party CDN or codec.
    await page.route(desktopVideoClue.content.url, (route) =>
      route.fulfill({ status: 204 }),
    );
    await login(page, `/play/assignment1?theme=${theme}`);
    const shelf = page.getByRole("complementary", { name: "线索手记" });
    const trigger = shelf.getByRole("button", { name: "播放线索影像" });
    await expect(shelf.getByRole("link")).toHaveCount(0);

    for (const size of [
      { width: 1100, height: 700 },
      { width: 1366, height: 768 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(size);
      await expect(trigger).toBeInViewport({ ratio: 1 });
      const geometry = await trigger.evaluate((button) => {
        const rect = button.getBoundingClientRect();
        const parts = [
          ".desktop-clue-video__seal",
          ".desktop-clue-video__copy",
          ".desktop-clue-video__star",
        ].map((selector) =>
          button.querySelector(selector)!.getBoundingClientRect(),
        );
        return {
          aligned: parts.every(
            (part) =>
              Math.abs(
                part.top + part.height / 2 - (rect.top + rect.height / 2),
              ) <= 1,
          ),
          contained: parts.every(
            (part) => part.left >= rect.left && part.right <= rect.right,
          ),
          overlaps: parts.some(
            (part, i) => i > 0 && parts[i - 1].right > part.left,
          ),
          overflow: button.scrollWidth > button.clientWidth,
        };
      });
      expect(geometry).toEqual({
        aligned: true,
        contained: true,
        overlaps: false,
        overflow: false,
      });
    }

    await trigger.focus();
    await expect(trigger).toBeFocused();
    const pageCount = context.pages().length;
    const previousUrl = page.url();
    const requestPromise = page.waitForRequest(desktopVideoClue.content.url);
    await page.keyboard.press("Enter");
    const request = await requestPromise;
    expect(request.isNavigationRequest()).toBe(false);
    expect(await request.headerValue("referer")).toBe(
      `${new URL(previousUrl).origin}/`,
    );
    const viewer = page.getByRole("dialog", { name: "视频播放器" });
    await expect(viewer).toBeVisible();
    await expect(viewer.locator("video")).toHaveAttribute(
      "src",
      desktopVideoClue.content.url,
    );
    expect(context.pages()).toHaveLength(pageCount);
    expect(page.url()).toBe(previousUrl);
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(trigger).toHaveCount(0);
    // Mobile retains its per-question clues, unlike the desktop archive shelf.
    await page.getByRole("button", { name: "01 已完成", exact: true }).click();
    const mobileClue = page.locator('.clue-card[data-kind="video"]');
    await expect(mobileClue).toBeVisible();
    await mobileClue.click();
    await expect(viewer).toBeVisible();
  });
}
