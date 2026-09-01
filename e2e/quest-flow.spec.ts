import { expect, test } from "@playwright/test";
import { mockQuestionsApi, enterGame, login } from "./fixtures";

test("single assignment settles on the server and survives reload", async ({
  page,
}) => {
  await mockQuestionsApi(page, { single: true });
  await enterGame(page);
  await expect(page.getByRole("navigation", { name: "题目导航" })).toHaveCount(
    0,
  );
  await expect(
    page.locator(".session-header").getByLabel("答题进度"),
  ).toHaveText("0/1已完成");
  await expect(page.getByPlaceholder("输入你的答案")).toHaveClass(
    /ui-input--line/,
  );
  await expect(
    page.locator(".quest-card > .quest-card-chrome > i"),
  ).toHaveCount(4);
  await expect(
    page.locator(".game-section-heading, .game-header, .game-finish"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "查看题目图片 1" }).click();
  await expect(page.getByRole("dialog", { name: "图片预览" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByPlaceholder("输入你的答案").fill("星辰，大海");
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(
    page.getByText("全部题目已经完成。", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "组合谜题全部破解" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByPlaceholder("输入你的答案")).toBeDisabled();
  await expect(page.getByLabel("答题进度")).toHaveText("1/1已完成");
  await expect(page.locator(".quest-card .feedback")).toHaveCount(0);
});

test("multi-question assignment unlocks sequentially", async ({ page }) => {
  await mockQuestionsApi(page);
  await enterGame(page);
  await expect(page.getByRole("button", { name: /02/ })).toBeDisabled();
  await page.getByPlaceholder("输入你的答案").fill("星辰大海");
  await page.getByRole("button", { name: "提交答案" }).click();
  await page.getByRole("button", { name: "前往下一题" }).click();
  await page.getByText("北极星", { exact: true }).click();
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(
    page.getByRole("dialog", { name: "组合谜题全部破解" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "查看组合结果" }).click();
  await expect(page.getByText("本场线索已经解锁")).toBeVisible();
});

test("incorrect choice displays the server cooldown", async ({ page }) => {
  await mockQuestionsApi(page);
  await enterGame(page);
  await page.getByPlaceholder("输入你的答案").fill("星辰大海");
  await page.getByRole("button", { name: "提交答案" }).click();
  await page.getByRole("button", { name: "前往下一题" }).click();
  await page.getByText("月亮", { exact: true }).click();
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByRole("button", { name: "提交答案" })).toBeDisabled();
});

test("new players must change password; logout removes access to private pages", async ({
  page,
}) => {
  await mockQuestionsApi(page, { mustChange: true });
  await login(page);
  await expect(page.getByRole("heading", { name: /修改/ })).toBeVisible();
  await page
    .getByLabel("当前密码", { exact: true })
    .fill("Ui-test-password-123");
  await page.getByLabel("新密码", { exact: true }).fill("New-password-123");
  await page.getByLabel("确认新密码", { exact: true }).fill("New-password-123");
  await page.getByRole("button", { name: /保存新密码/ }).click();
  await expect(
    page.getByRole("heading", { name: "下一段故事，等你落笔。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "打开冒险者菜单" }).click();
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page.getByLabel("登录账号", { exact: true })).toBeVisible();
  await page.goto("/play/assignment1");
  await expect(page.getByLabel("登录账号", { exact: true })).toBeVisible();
  await expect(page.getByText("星辰之门", { exact: true })).toHaveCount(0);
});

test("empty text, whitespace and unselected choices use the timed danger alert without an API attempt", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  let attempts = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/answers")) attempts++;
  });
  await enterGame(page);
  const guide = page.getByRole("button", { name: "知道了", exact: true });
  if (await guide.isVisible()) await guide.click();
  const submit = page.getByRole("button", { name: "提交答案" });
  await submit.click();
  const hint = page.locator(".quest-card .feedback");
  await expect(hint).toContainText("请先输入或选择答案。");
  await expect(hint).toHaveAttribute("data-tone", "danger");
  await expect(page.getByPlaceholder("输入你的答案")).not.toHaveAttribute(
    "required",
  );
  await page.getByPlaceholder("输入你的答案").fill("   ");
  await submit.click();
  await expect(hint).toContainText("请先输入或选择答案。");
  expect(attempts).toBe(0);
  await page.getByPlaceholder("输入你的答案").fill("星辰大海");
  await submit.click();
  await page.getByRole("button", { name: "前往下一题" }).click();
  await submit.click();
  await expect(hint).toContainText("请先输入或选择答案。");
  expect(attempts).toBe(1);
  await expect(page.getByRole("timer")).toHaveCount(0);
});

test("the original combined-clue dialog and launcher survive a completed-session reload", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await enterGame(page);
  await page.getByPlaceholder("输入你的答案").fill("星辰大海");
  await page.getByRole("button", { name: "提交答案" }).click();
  await page.getByRole("button", { name: "前往下一题" }).click();
  await page.getByText("北极星", { exact: true }).click();
  await page.getByRole("button", { name: "提交答案" }).click();
  await page.getByRole("button", { name: "查看组合结果" }).click();
  const combined = page.getByRole("dialog", { name: "星辰组合真相" });
  await expect(combined).toHaveClass(/multi-clue-dialog/);
  await combined.getByRole("button", { name: "收下线索" }).click();
  await page.reload();
  await page.getByRole("button", { name: "查看本场线索" }).click();
  await expect(combined).toBeVisible();
  await expect(page.locator(".quest-card .clue-panel")).toHaveCount(0);
});

test("notifications retain the original floating archive after server read acknowledgement", async ({
  page,
}) => {
  test.setTimeout(60000);
  await mockQuestionsApi(page, { single: true, notifications: true });
  await enterGame(page);
  await page.getByRole("button", { name: "收到消息", exact: true }).click();
  const launcher = page.getByRole("button", { name: "打开通知列表" });
  await expect(launcher).toHaveClass("notification-bell");
  await launcher.click();
  const archive = page.getByLabel("通知列表", { exact: true });
  await expect(archive).toHaveClass("notification-list");
  await archive.getByRole("button", { name: /来自工作人员的消息/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "请到入口领取下一份线索。",
  );
  await page.getByRole("button", { name: "收到消息", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "打开通知列表" })).toBeVisible({
    timeout: 15000,
  });
});
