import { expect, test } from "@playwright/test";
import { fulfillJson, login, mockQuestionsApi } from "@e2e/fixtures";
import { makeNotifications } from "@/test/game-fixtures";

test("star letters collect unlocked narratives and return to their mailbox tab", async ({
  page,
}) => {
  const { assignment } = await mockQuestionsApi(page, { completed: true });
  assignment.clues = [
    {
      id: "blessing",
      source: "session",
      definitionId: "blessing",
      trigger: "session_completed",
      question: "",
      sessionLevel: "",
      kind: "bless",
      position: 0,
      narrative: "bless1",
      autoPlay: false,
      content: {
        title: "星海的祝福",
        text: "这一程的星光",
        url: "",
        imageUrls: [],
        buttonText: "打开",
      },
      unlockedAt: new Date().toISOString(),
    },
  ];
  await login(page, "/notifications");
  await page.getByRole("tab", { name: "星海信笺", exact: true }).click();
  const rows = page.locator(".mailbox-row");
  await expect(rows).toHaveCount(1);
  await expect(page.getByRole("button", { name: "来信操作" })).toHaveCount(0);
  await rows.locator(".mailbox-row__open").click();
  await expect(page).toHaveURL(/\/content\/bless1$/);
  const back = page.getByRole("link", { name: "返回冒险" });
  await expect(back).toHaveAttribute("href", "/notifications?tab=stars");
  await back.click();
  await expect(
    page.getByRole("tab", { name: "星海信笺", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: /星海的祝福/ })).toBeVisible();
});

test("touch swipe reveals acceptance and long mail stays compact in both themes", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await mockQuestionsApi(page);
  const notes = makeNotifications();
  notes[0].content = "这是一封很长的来信。".repeat(200);
  let reads = 0;
  await page.route("**/api/questions/v1/notifications", (route) =>
    fulfillJson(route, { items: notes }),
  );
  await page.route(
    "**/api/questions/v1/notifications/preview-note/read",
    (route) => {
      reads++;
      notes[0].readAt = new Date().toISOString();
      return fulfillJson(route, {});
    },
  );
  await login(page, "/notifications");
  const row = page.locator(".mailbox-row").first();
  await expect(row).toBeVisible();
  for (const theme of ["light", "dark"]) {
    await page.goto(`/notifications?theme=${theme}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(row).toBeVisible();
    expect(
      await row.evaluate((el) => el.getBoundingClientRect().height),
    ).toBeLessThan(160);
    await page.screenshot({
      path: `/tmp/questions-mailbox-${theme}.png`,
      animations: "disabled",
    });
  }
  const target = row.locator(".mailbox-row__open");
  await target.dispatchEvent("pointerdown", {
    pointerType: "touch",
    clientX: 290,
    clientY: 50,
  });
  await target.dispatchEvent("pointermove", {
    pointerType: "touch",
    clientX: 110,
    clientY: 53,
  });
  await target.dispatchEvent("pointerup", {
    pointerType: "touch",
    clientX: 110,
    clientY: 53,
  });
  await expect(row).toHaveAttribute("data-revealed", "true");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(reads).toBe(0);
  await row.getByRole("button", { name: "收下", exact: true }).click();
  await expect(row).toHaveAttribute("data-read", "true");
  expect(reads).toBe(1);
  await target.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "关闭信件", exact: true }),
  ).toBeVisible();
  await context.close();
});
