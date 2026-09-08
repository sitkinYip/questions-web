import { expect, test } from "@playwright/test";
import { fulfillJson, login, mockQuestionsApi } from "@e2e/fixtures";
import { desktopAssignment } from "@e2e/desktop-preview-data";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

for (const theme of ["light", "dark"] as const) {
  test(`full-page loading fits ${theme} screens and disappears as soon as the real queries finish`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { player, assignment } = await mockQuestionsApi(page);
    Object.assign(assignment, structuredClone(desktopAssignment), {
      id: "assignment1",
      player: player.id,
    });
    const profileReady = deferred();
    const journeyReady = deferred();
    let profileRequests = 0;
    await page.route("**/api/questions/v1/me", async (route) => {
      // Login validates /me before publishing auth; hold the gate's next fetch.
      if (++profileRequests > 1) await profileReady.promise;
      await fulfillJson(route, player);
    });
    await page.route(
      "**/api/questions/v1/assignments/assignment1",
      async (route) => {
        await journeyReady.promise;
        await fulfillJson(route, assignment);
      },
    );
    try {
      await login(page, `/play/assignment1?theme=${theme}`);
      const loader = page.locator(".game-loading-screen");
      await expect(page.getByRole("status")).toHaveText("正在读取冒险者资料…");
      profileReady.resolve();
      await expect(page.getByRole("status")).toHaveText("正在准备本场冒险…");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      for (const size of [
        { width: 320, height: 568 },
        { width: 390, height: 844 },
        { width: 1280, height: 720 },
        { width: 1920, height: 1080 },
        { width: 844, height: 390 },
      ]) {
        await page.setViewportSize(size);
        await expect(loader.getByRole("heading", { level: 1 })).toBeInViewport({
          ratio: 1,
        });
        await expect(loader.getByRole("status")).toBeInViewport({ ratio: 1 });
        await expect(
          loader.locator(".game-loading-screen__footer"),
        ).toBeInViewport({ ratio: 1 });
        expect(
          await loader.evaluate((element) => ({
            fits:
              document.documentElement.scrollWidth <= innerWidth + 1 &&
              document.documentElement.scrollHeight <= innerHeight + 1,
            animations: element
              .querySelector(".game-loading-screen__art")!
              .getAnimations({ subtree: true }).length,
          })),
        ).toEqual({ fits: true, animations: 0 });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() =>
        document.documentElement.style.setProperty("--safe-area-top", "59px"),
      );
      await expect
        .poll(
          async () =>
            (await loader
              .locator(".game-loading-screen__header")
              .boundingBox())!.y,
        )
        .toBeGreaterThanOrEqual(59);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect
        .poll(() =>
          loader
            .locator(".game-loading-screen__art")
            .evaluate(
              (element) => element.getAnimations({ subtree: true }).length,
            ),
        )
        .toBeGreaterThan(0);
      journeyReady.resolve();
      await expect(loader).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "星图上的北方" }),
      ).toBeVisible();
    } finally {
      profileReady.resolve();
      journeyReady.resolve();
    }
  });
}

test("narrative loading retains navigation, yields to errors and retries into the story", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockQuestionsApi(page);
  const narrativeReady = deferred();
  let shouldFail = true;
  await page.route(
    "**/api/questions/v1/assignments/assignment1/narratives/loading-letter",
    async (route) => {
      await narrativeReady.promise;
      if (shouldFail) {
        await fulfillJson(
          route,
          { error: { code: "FORBIDDEN", message: "这份故事暂时无法打开" } },
          403,
        );
      } else {
        await fulfillJson(route, {
          id: "loading-letter",
          kind: "letter",
          title: "来自星空的信",
          payload: {
            variant: "modern",
            hintText: "轻触信封，展开故事",
            paragraphs: [{ content: "愿你找到自己的北方。" }],
          },
        });
      }
    },
  );
  try {
    await login(page, "/play/assignment1/content/loading-letter");
    await expect(page.getByRole("status")).toHaveText("正在准备这份专属内容…");
    await page.getByRole("button", { name: "打开冒险者菜单" }).click();
    await expect(
      page.getByRole("navigation", { name: "个人导航" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("navigation", { name: "个人导航" }),
    ).toHaveCount(0);
    await page.mouse.move(800, 600);
    narrativeReady.resolve();
    await expect(page.getByRole("alert")).toContainText("这份故事暂时无法打开");
    await expect(page.locator(".game-loading-screen")).toHaveCount(0);
    shouldFail = false;
    await page.getByRole("button", { name: "重新尝试" }).click();
    await expect(page.getByRole("button", { name: /轻触信封/ })).toBeVisible();
    await expect(page.locator(".game-loading-screen")).toHaveCount(0);
  } finally {
    narrativeReady.resolve();
  }
});
