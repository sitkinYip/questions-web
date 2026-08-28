import { expect, test, type Page } from "@playwright/test";
import { enterGame, login, mockQuestionsApi } from "./fixtures";
import { imageAssignment } from "./question-image-fixtures";

// Device emulation does not expose a physical notch. Exercise the same tokens
// consumed by env(safe-area-inset-*) with explicit inset values instead.
async function setSafeInsets(page: Page, top: number, bottom = 0) {
  await page.evaluate(
    ({ top, bottom }) => {
      document.documentElement.style.setProperty("--safe-area-top", `${top}px`);
      document.documentElement.style.setProperty(
        "--safe-area-bottom",
        `${bottom}px`,
      );
    },
    { top, bottom },
  );
}

for (const withImage of [false, true]) {
  test(`short ${withImage ? "image" : "text"} questions start at the safe top edge at every mobile height`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 932 });
    const { assignment } = await mockQuestionsApi(page);
    Object.assign(assignment, structuredClone(imageAssignment), {
      id: "assignment1",
      player: "playeralice",
    });
    if (!withImage) assignment.levels[0].question!.content[0].imageUrl = "";
    await login(page, "/play/assignment1");
    const layout = page.locator(".quest-layout");
    const header = page.locator(".session-header");
    for (const height of [932, 1200, 740]) {
      await page.setViewportSize({ width: 390, height });
      for (const inset of [0, 59]) {
        await setSafeInsets(page, inset, 34);
        await expect(layout).toHaveCSS("align-content", "start");
        await expect
          .poll(() =>
            header.evaluate((element) => element.getBoundingClientRect().top),
          )
          .toBeCloseTo(Math.max(24, inset), 0);
        await expect(
          page.getByRole("button", { name: "提交答案" }),
        ).toBeInViewport({ ratio: 1 });
      }
    }
  });
}

for (const single of [true, false]) {
  test(`${single ? "single" : "multi"} question view keeps the avatar as its only navigation entry`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await mockQuestionsApi(page, { single });
    await enterGame(page);
    await expect(page.locator(".game-play-context")).toHaveCount(0);
    await expect(page.getByText("场次详情", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /返回启程/ })).toHaveCount(0);
    await expect(
      page.locator(
        single
          ? ".session-header + .quest-card"
          : ".session-header + .quest-nav",
      ),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "打开冒险者菜单" }).click();
    await expect(
      page.getByRole("navigation", { name: "个人导航" }).getByRole("link"),
    ).toHaveCount(4);
  });
}

for (const viewport of [
  { width: 320, height: 568, inset: 0 },
  { width: 360, height: 640, inset: 44 },
  { width: 390, height: 664, inset: 59 },
  { width: 390, height: 932, inset: 59 },
  { width: 430, height: 1024, inset: 59 },
]) {
  test(`sidebar actions fit ${viewport.width}×${viewport.height} with a ${viewport.inset}px top inset`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { player } = await mockQuestionsApi(page);
    player.displayName = "星图尽头仍在寻找答案的远航者";
    player.nextLevel = {
      ...player.level,
      id: "rank2",
      order: 2,
      name: "追星人",
      minTotalXp: 100,
    };
    await enterGame(page);
    await setSafeInsets(page, viewport.inset);
    const avatar = page.getByRole("button", { name: "打开冒险者菜单" });
    await avatar.click();
    const sidebar = page.getByRole("dialog", {
      name: "冒险者菜单",
      exact: true,
    });
    await sidebar.getByRole("link", { name: "奇遇收藏" }).click();
    await avatar.click();
    // The longest navigation state includes the return-to-question link.
    await expect(sidebar.getByRole("link")).toHaveCount(5);
    await expect(sidebar.locator(".player-passport")).toHaveCount(0);
    await expect(sidebar.getByText("0 EXP", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("距下一级 100 EXP")).toBeVisible();
    const close = sidebar.getByRole("button", { name: "关闭冒险者菜单" });
    await expect(close).toBeFocused();
    await expect(close.locator("svg")).toHaveCSS("width", "24px");
    await expect(close).toHaveCSS("width", "44px");
    await expect(close).toHaveCSS("height", "44px");
    await expect(close).toBeInViewport({ ratio: 0.999 });
    expect((await close.boundingBox())!.y).toBeGreaterThanOrEqual(
      viewport.inset,
    );
    for (const action of await sidebar
      .locator("nav a, .game-theme-picker label, .game-sidebar__logout")
      .all()) {
      await expect(action).toBeInViewport({ ratio: 0.999 });
    }
    expect(
      await sidebar.evaluate(
        (element) => element.scrollHeight <= element.clientHeight,
      ),
    ).toBe(true);
    expect(
      await sidebar.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    const composition = await sidebar.evaluate((element) => {
      const sheet = element.getBoundingClientRect();
      const header = element
        .querySelector(".ui-sheet__header")!
        .getBoundingClientRect();
      const nav = element
        .querySelector(".game-sidebar__nav")!
        .getBoundingClientRect();
      const footer = element
        .querySelector(".game-sidebar__footer")!
        .getBoundingClientRect();
      const style = getComputedStyle(element);
      const usableHeight =
        sheet.height -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      return {
        bottomGap:
          sheet.bottom - footer.bottom - parseFloat(style.paddingBottom),
        navFooterGap: footer.top - nav.bottom,
        occupiedRatio:
          (header.height + nav.height + footer.height) / usableHeight,
      };
    });
    // No scrolling is necessary, but that alone is not a complete layout check:
    // the footer must reach the bottom and the sections must use the available height.
    expect(Math.abs(composition.bottomGap)).toBeLessThanOrEqual(1);
    expect(composition.navFooterGap).toBeLessThanOrEqual(24);
    expect(composition.occupiedRatio).toBeGreaterThan(0.88);
    if (viewport.height >= 900) {
      await expect(sidebar.locator(".celestial-atlas")).toBeVisible();
      await expect(
        sidebar.locator(".game-sidebar__nav-copy small").first(),
      ).toBeVisible();
    } else {
      await expect(sidebar.locator(".celestial-atlas")).toBeHidden();
    }
    await close.click();
    await expect(sidebar).toHaveCount(0);
    await expect(avatar).toBeFocused();
  });
}

test("an open sidebar adapts across height thresholds without losing actions or leaving a blank tail", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await expect(page.locator(".game-topbar")).toBeVisible();
  await setSafeInsets(page, 44);
  await page.getByRole("button", { name: "打开冒险者菜单" }).click();
  const sidebar = page.getByRole("dialog", { name: "冒险者菜单", exact: true });
  for (const height of [
    1200, 1024, 900, 820, 808, 800, 740, 688, 680, 640, 568,
  ]) {
    await page.setViewportSize({ width: 390, height });
    await expect(sidebar).toHaveCSS("height", `${height}px`);
    await expect(sidebar.getByRole("link")).toHaveCount(4);
    await expect(
      sidebar.getByRole("button", { name: "退出登录" }),
    ).toBeInViewport({ ratio: 0.999 });
    expect(
      await sidebar.evaluate(
        (element) => element.scrollHeight <= element.clientHeight,
      ),
    ).toBe(true);
    const footerBottom = await sidebar
      .locator(".game-sidebar__footer")
      .evaluate((element) => element.getBoundingClientRect().bottom);
    expect(height - footerBottom).toBeLessThanOrEqual(29);
  }
  await page.getByRole("radio", { name: "浅色", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    sidebar.getByRole("button", { name: "关闭冒险者菜单" }),
  ).toBeInViewport({ ratio: 0.999 });
});

test("question top spacing takes the larger inset and never reserves a bottom tab area", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await mockQuestionsApi(page);
  await enterGame(page);
  for (const inset of [0, 12, 44, 59]) {
    await setSafeInsets(page, inset, 34);
    await expect(page.locator(".quest-layout")).toHaveCSS(
      "padding-top",
      `${Math.max(24, inset)}px`,
    );
    await expect(page.locator(".quest-layout")).toHaveCSS(
      "padding-bottom",
      "36px",
    );
  }
  await expect(page.getByRole("navigation", { name: "冒险导航" })).toHaveCount(
    0,
  );
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    /viewport-fit=cover/,
  );
});

test("login and lobby preserve ordinary header spacing and clear a notch", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await page.goto("/login");
  for (const width of [390, 700, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await setSafeInsets(page, 0, 34);
    const header = page.locator(".game-auth__header");
    const baseline = await header.boundingBox();
    await setSafeInsets(page, 8, 34);
    expect(await header.boundingBox()).toEqual(baseline);
    await setSafeInsets(page, 59, 34);
    expect(
      (await header.locator(".game-theme-picker").boundingBox())!.y,
    ).toBeGreaterThanOrEqual(59);
    await expect(page.locator(".game-auth")).toHaveCSS("padding-bottom", "0px");
  }
  await login(page);
  await expect(page.locator(".game-topbar")).toBeVisible();
  for (const width of [390, 700, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await setSafeInsets(page, 0, 34);
    const header = page.locator(".game-topbar");
    const baseline = await header.boundingBox();
    await setSafeInsets(page, 8, 34);
    expect(await header.boundingBox()).toEqual(baseline);
    await setSafeInsets(page, 59, 34);
    const avatar = header.getByRole("button", { name: "打开冒险者菜单" });
    expect((await avatar.boundingBox())!.y).toBeGreaterThanOrEqual(59);
    if (width < 760) {
      await expect(page.locator(".game-navigation")).toHaveCSS(
        "padding-bottom",
        "42px",
      );
      await expect(page.locator(".game-world")).toHaveCSS(
        "padding-bottom",
        "114px",
      );
      const nav = await page.locator(".game-navigation").boundingBox();
      expect(nav!.y + nav!.height).toBe(900);
    } else {
      await expect(page.locator(".game-world")).toHaveCSS(
        "padding-bottom",
        "0px",
      );
    }
  }
});
