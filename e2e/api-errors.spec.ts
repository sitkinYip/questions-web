import { expect, test } from "@playwright/test";
import { fulfillJson, login, mockQuestionsApi } from "./fixtures";

test("reports a mismatched server contract without rendering private content", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await page.route("**/api/questions/v1/me", (route) =>
    fulfillJson(route, { id: "broken" }),
  );
  await login(page);
  await expect(page.getByRole("alert")).toContainText("服务端数据版本不匹配");
  await expect(page.getByRole("heading", { name: "我的场次" })).toHaveCount(0);
});

test("recovers from a server error without discarding the login", async ({
  page,
}) => {
  const state = await mockQuestionsApi(page);
  let recovered = false;
  await page.route("**/api/questions/v1/assignments", (route) =>
    recovered
      ? fulfillJson(route, { items: [state.assignment] })
      : fulfillJson(
          route,
          { error: { code: "UNAVAILABLE", message: "服务暂时不可用" } },
          503,
        ),
  );
  await login(page);
  await expect(page.getByRole("alert")).toContainText("服务暂时不可用", {
    timeout: 15000,
  });
  recovered = true;
  await page.getByRole("button", { name: "重新尝试" }).click();
  await expect(page.getByRole("heading", { name: "星辰探险" })).toBeVisible();
});

for (const resource of ["me", "assignments/assignment1"]) {
  test(`background ${resource} failure preserves the answer and recovers`, async ({
    page,
  }) => {
    await mockQuestionsApi(page, { single: true });
    await login(page, "/play/assignment1");
    await page.getByRole("button", { name: "开始本场冒险" }).click();
    const input = page.getByPlaceholder("输入你的答案");
    await input.fill("未提交的答案");
    await page.route(`**/api/questions/v1/${resource}`, (route) =>
      fulfillJson(
        route,
        { error: { code: "UNAVAILABLE", message: "服务暂时不可用" } },
        503,
      ),
    );
    await expect(page.getByText("同步暂时中断", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(input).toHaveValue("未提交的答案");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.unroute(`**/api/questions/v1/${resource}`);
    await expect(page.getByText("同步暂时中断", { exact: true })).toHaveCount(
      0,
      { timeout: 15000 },
    );
    await expect(input).toHaveValue("未提交的答案");
  });
}

for (const theme of ["dark", "light"]) {
  test(`answer retries preserve the command and show an in-place ${theme} dialog`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: theme === "dark" ? 1280 : 390,
      height: 844,
    });
    await mockQuestionsApi(page, { single: true });
    await login(page, `/play/assignment1?theme=${theme}`);
    await page.getByRole("button", { name: "开始本场冒险" }).click();
    const input = page.getByPlaceholder("输入你的答案");
    await input.fill("星辰大海");
    const commands: string[] = [];
    let failed = true;
    await page.route(
      "**/api/questions/v1/assignments/assignment1/answers",
      async (route) => {
        commands.push(route.request().postData()!);
        if (failed)
          await fulfillJson(
            route,
            { error: { code: "UNAVAILABLE", message: "服务暂时不可用" } },
            503,
          );
        else await route.fallback();
      },
    );
    await page.getByRole("button", { name: /提交答案/ }).click();
    const dialog = page.getByRole("dialog", { name: "答案还在，等待回音" });
    await expect(dialog).toBeVisible({ timeout: 10000 });
    expect(commands).toHaveLength(4);
    await expect(input).toHaveValue("星辰大海");
    await expect(
      dialog.getByRole("button", { name: "重新连接", exact: true }),
    ).toBeInViewport();
    await page.screenshot({ path: `test-results/retry-dialog-${theme}.png` });
    failed = false;
    await dialog.getByRole("button", { name: "重新连接", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(commands).toHaveLength(5);
    expect(new Set(commands).size).toBe(1);
  });
}

test("a revoked assignment removes the cached question", async ({ page }) => {
  await mockQuestionsApi(page, { single: true });
  await login(page, "/play/assignment1");
  await page.getByRole("button", { name: "开始本场冒险" }).click();
  await page.getByPlaceholder("输入你的答案").fill("草稿");
  await page.route("**/api/questions/v1/assignments/assignment1", (route) =>
    fulfillJson(
      route,
      { error: { code: "SESSION_OFFLINE", message: "该场次已下线" } },
      409,
    ),
  );
  await expect(page.getByRole("alert")).toContainText("该场次已下线", {
    timeout: 10000,
  });
  await expect(page.getByPlaceholder("输入你的答案")).toHaveCount(0);
});

test("start failures can be dismissed and retried without leaving the briefing", async ({
  page,
}) => {
  await mockQuestionsApi(page, { single: true });
  await login(page, "/play/assignment1");
  await page.route(
    "**/api/questions/v1/assignments/assignment1/start",
    (route) => fulfillJson(route, {}, 503),
  );
  await page.getByRole("button", { name: "开始本场冒险" }).click();
  const dialog = page.getByRole("dialog", { name: "旅程正在等待连接" });
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await dialog.getByRole("button", { name: "留在当前页面" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "开始本场冒险" }),
  ).toBeEnabled();
  await page.unroute("**/api/questions/v1/assignments/assignment1/start");
  await page.getByRole("button", { name: "开始本场冒险" }).click();
  await expect(page.getByPlaceholder("输入你的答案")).toBeVisible();
});
