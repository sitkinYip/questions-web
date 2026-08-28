import { expect, test } from "@playwright/test";
import { fulfillJson, login, mockQuestionsApi } from "./fixtures";
import { makeNotifications, makeRewards } from "../src/test/game-fixtures";

test("mobile login keeps the primary action visible and theme controls named", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login?theme=dark");
  await expect(page.getByRole("button", { name: "进入冒险" })).toBeInViewport();
  await page.getByRole("radio", { name: "浅色", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("密码", { exact: true }).fill("local-test-only");
  await page.getByRole("button", { name: "显示密码" }).click();
  await expect(page.getByLabel("密码", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "隐藏密码" }).click();
  await expect(page.getByLabel("密码", { exact: true })).toHaveValue(
    "local-test-only",
  );
});

test("lobby filters history and reflects changing availability", async ({
  page,
}) => {
  const { assignment } = await mockQuestionsApi(page);
  assignment.startsAt = new Date(Date.now() + 60000).toISOString();
  await login(page);
  await expect(page.getByText("静候启程", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: /旅途回响/ }).click();
  await expect(
    page.getByRole("heading", { name: "故事的第一页，还空着。" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /待赴之约/ }).click();
  assignment.startsAt = "";
  await expect(page.getByText("可以出发", { exact: true })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("link", { name: "开启旅程" }).click();
  await expect(page.getByRole("heading", { name: "星辰探险" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "开始本场冒险" }),
  ).toBeEnabled();
});

test("assignment briefing disables start before the opening time", async ({
  page,
}) => {
  const { assignment } = await mockQuestionsApi(page);
  assignment.startsAt = new Date(Date.now() + 86400000).toISOString();
  await login(page, "/play/assignment1");
  await expect(
    page.getByRole("button", { name: "开始本场冒险" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("status").filter({ hasText: "静候启程" }),
  ).toBeVisible();
});

test("profile saves through the existing multipart contract and preserves a tabbed draft", async ({
  page,
}) => {
  const { player } = await mockQuestionsApi(page);
  await page.route("**/api/questions/v1/me/profile", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().headers()["content-type"]).toContain(
      "multipart/form-data",
    );
    expect(route.request().postData()).toContain("追星旅人");
    player.displayName = "追星旅人";
    await fulfillJson(route, player);
  });
  await login(page, "/profile");
  const name = page.getByLabel("显示昵称", { exact: true });
  await name.fill("追星旅人");
  if (await page.getByRole("tab", { name: "账号安全" }).isVisible()) {
    await page.getByRole("tab", { name: "账号安全" }).click();
    await page.getByRole("tab", { name: "我的名片" }).click();
  } else {
    await expect(page.getByLabel("当前密码", { exact: true })).toBeInViewport();
  }
  await expect(name).toHaveValue("追星旅人");
  await page.getByRole("button", { name: "保存资料" }).click();
  await expect(page.getByRole("status")).toContainText("资料已保存");
  await expect(page.locator(".player-passport h2")).toHaveText("追星旅人");
});

test("invalid avatar and mismatched passwords never call write endpoints", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  let writes = 0;
  page.on("request", (request) => {
    if (/\/me\/(profile|change-password)$/.test(request.url())) writes++;
  });
  await login(page, "/profile");
  await page.getByLabel("上传头像").setInputFiles({
    name: "large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole("alert")).toContainText("2 MB");
  if (await page.getByRole("tab", { name: "账号安全" }).isVisible()) {
    await page.getByRole("tab", { name: "账号安全" }).click();
  }
  await page
    .getByLabel("当前密码", { exact: true })
    .fill("current-test-password");
  await page.getByLabel("新密码", { exact: true }).fill("new-test-password");
  await page
    .getByLabel("确认新密码", { exact: true })
    .fill("different-test-password");
  await page.getByRole("button", { name: "保存新密码" }).click();
  await expect(page.locator("#password-validation")).toContainText(
    "两次新密码不一致",
  );
  expect(writes).toBe(0);
});

test("failed profile saves keep the typed name available for retry", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await page.route("**/api/questions/v1/me/profile", (route) =>
    fulfillJson(
      route,
      { error: { code: "UNAVAILABLE", message: "保存暂时失败，请重试" } },
      503,
    ),
  );
  await login(page, "/profile");
  await page.getByLabel("显示昵称", { exact: true }).fill("等待保存的旅人");
  await page.getByRole("button", { name: "保存资料" }).click();
  await expect(page.getByRole("alert")).toContainText("保存暂时失败");
  await expect(page.getByLabel("显示昵称", { exact: true })).toHaveValue(
    "等待保存的旅人",
  );
  await expect(page.getByRole("button", { name: "保存资料" })).toBeEnabled();
});

test("rewards show claim details only while available", async ({ page }) => {
  await mockQuestionsApi(page);
  const rewards = makeRewards();
  rewards[1].claimDetails = "PRIVATE-EXPIRED-CLAIM";
  await page.route("**/api/questions/v1/rewards", (route) =>
    fulfillJson(route, { items: rewards }),
  );
  await login(page, "/rewards");
  await expect(page.getByRole("heading", { name: "星辰纪念章" })).toBeVisible();
  await expect(page.getByText("你的领取线索")).toBeVisible();
  await expect(page.getByText("PRIVATE-EXPIRED-CLAIM")).toHaveCount(0);
});

test("a letter can be acknowledged without losing its contents", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  const notes = makeNotifications();
  await page.route("**/api/questions/v1/notifications", (route) =>
    fulfillJson(route, { items: notes }),
  );
  await page.route(
    "**/api/questions/v1/notifications/preview-note/read",
    (route) => {
      notes[0].readAt = new Date().toISOString();
      return fulfillJson(route, {});
    },
  );
  await login(page, "/notifications");
  const letter = page
    .locator(".notification-letter")
    .filter({ hasText: "新的线索已送达" });
  await letter.getByRole("button", { name: "收到消息" }).click();
  await expect(letter.getByRole("status")).toHaveText("来信已收好");
  await expect(letter.getByText(/请到入口领取下一份线索/)).toBeVisible();
});

test("narrow layouts and long content never overflow; bottom navigation stays reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const { assignment, player } = await mockQuestionsApi(page);
  player.displayName = "星图尽头仍然在寻找答案的远航者";
  assignment.title = "这是一场名字很长但仍然需要完整展示的星辰探险";
  await login(page);
  for (const label of ["启程", "收藏", "来信", "护照"]) {
    const nav = page.getByRole("navigation", { name: "冒险导航" });
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(
      nav.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(nav).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await expect(page.getByRole("button", { name: "保存资料" })).toBeVisible();
});

test("reduced motion leaves the lobby readable without running atlas animations", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await expect(
    page.getByRole("heading", { name: "下一段故事，等你落笔。" }),
  ).toBeVisible();
  await expect(
    page.locator(".celestial-atlas__orbit--outer").first(),
  ).toHaveCSS("animation-name", "none");
  await expect(page.locator(".chapter-card").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});
