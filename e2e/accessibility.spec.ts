import { expect, test } from "@playwright/test";
import { mockQuestionsApi, enterGame } from "@e2e/fixtures";

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

  const mediaButtons = page.locator(
    ".question-image button, .question-gallery button",
  );
  await expect(mediaButtons).toHaveCount(2);
  for (const button of await mediaButtons.all()) {
    // Wait for the answer feedback transform to settle before measuring.
    await expect
      .poll(async () => {
        const box = await button.boundingBox();
        return Math.min(box?.width ?? 0, box?.height ?? 0);
      })
      .toBeGreaterThanOrEqual(44);
    await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(button).toHaveCSS("border-width", "0px");
    await expect(button.locator("img")).toHaveCSS("border-width", "1px");
  }
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

test.describe("touch feedback", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("touch controls suppress native highlights and retain keyboard focus feedback", async ({
    page,
    browserName,
  }) => {
    await enterGame(page);
    const avatar = page.getByRole("button", {
      name: "打开冒险者菜单",
      includeHidden: true,
    });
    await expect(avatar).toHaveCSS("appearance", "none");
    await avatar.tap();
    const sidebar = page.getByRole("navigation", { name: "个人导航" });
    await expect(sidebar).toBeVisible();
    await expect(avatar).toHaveCSS("outline-style", "none");
    const home = sidebar.getByRole("link").filter({ hasText: "我的场次" });
    await home.tap();
    const navigation = page.getByRole("navigation", { name: "冒险导航" });
    await expect(navigation).toBeVisible();
    await navigation.getByRole("link", { name: "收藏" }).tap();
    await expect(
      navigation.getByRole("link", { name: "收藏" }),
    ).toHaveAttribute("aria-current", "page");
    // Includes SVG descendants and any controls mounted outside the app root.
    expect(
      await page
        .locator(
          "a, button, input, select, textarea, summary, [tabindex], a svg, button svg",
        )
        .evaluateAll((elements) =>
          elements.every(
            (element) =>
              getComputedStyle(element).getPropertyValue(
                "-webkit-tap-highlight-color",
              ) === "rgba(0, 0, 0, 0)",
          ),
        ),
    ).toBe(true);
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    const focused = page.locator(":focus-visible");
    await expect(focused).toHaveCount(1);
    await expect(focused).toHaveCSS("outline-style", "solid");
    await expect(focused).toHaveCSS("outline-width", "2px");
  });
});
