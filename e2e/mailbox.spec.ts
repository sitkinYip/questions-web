import { expect, test } from "@playwright/test";
import { fulfillJson, login, mockStarwardApi } from "@e2e/fixtures";
import { visibleBox } from "@e2e/layout-assertions";
import { makeNotifications } from "@/test/game-fixtures";

test("star letters collect unlocked narratives and return to their mailbox tab", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { assignment } = await mockStarwardApi(page, { completed: true });
  assignment.completionTarget = { kind: "narrative", id: "letter1" };
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
  await expect(rows).toHaveCount(2);
  await expect(page.getByRole("button", { name: "来信操作" })).toHaveCount(0);
  const finale = rows.filter({ hasText: "旅途终章" });
  await expect(finale.locator(".mailbox-row__title")).toHaveText(
    assignment.title,
  );
  await expect(finale.locator(".mailbox-row__summary")).toHaveCount(0);
  const [first, second] = await rows.evaluateAll((cards) =>
    cards.map((card) => {
      const { top, bottom } = card.getBoundingClientRect();
      return { top, bottom };
    }),
  );
  expect(second.top - first.bottom).toBeCloseTo(12, 0);
  await page.getByRole("button", { name: /星海的祝福/ }).click();
  await expect(page).toHaveURL(/\/content\/bless1$/);
  const back = page.getByRole("link", { name: "返回冒险" });
  await expect(back).toHaveAttribute("href", "/notifications?tab=stars");
  await back.click();
  await expect(
    page.getByRole("tab", { name: "星海信笺", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: /星海的祝福/ })).toBeVisible();
});

test("journey letters are separate cards in both themes and support touch acceptance", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await mockStarwardApi(page);
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
  const rows = page
    .getByRole("tabpanel", { name: /旅途来信/ })
    .locator(".mailbox-row");
  const row = rows.first();
  await expect(row).toBeVisible();
  for (const theme of ["light", "dark"]) {
    await page.goto(`/notifications?theme=${theme}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(rows).toHaveCount(notes.length);
    await expect(row).toHaveAttribute("data-read", "false");
    await expect(row).toHaveCSS("border-radius", "24px");
    const first = await visibleBox(row);
    const second = await visibleBox(rows.nth(1));
    expect(first.height).toBeLessThan(160);
    expect(second.y - first.y - first.height).toBeCloseTo(12, 0);
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

test("a newly received letter updates the bottom badge and its toast opens the inbox without marking it read", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockStarwardApi(page);
  const notes = makeNotifications().map((note) => ({
    ...note,
    readAt: note.sentAt,
  }));
  let receipts = 0;
  await page.route("**/api/questions/v1/notifications", (route) =>
    fulfillJson(route, { items: notes }),
  );
  await page.route("**/api/questions/v1/notifications/*/read", (route) => {
    receipts++;
    return fulfillJson(route, {});
  });
  await login(page);
  const nav = page.getByRole("navigation", { name: "冒险导航" });
  const mailbox = nav.getByRole("link", { name: "来信", exact: true });
  await expect(page.getByRole("heading", { name: "启程" })).toBeVisible();
  await expect(mailbox.locator(".game-navigation__unread")).toHaveCount(0);
  const added = {
    ...notes[0],
    id: "brand-new-letter",
    title: "新的远方来信",
    readAt: "",
  };
  notes.push(added);
  const toast = page
    .getByRole("listitem")
    .filter({ hasText: "有新的旅途来信" });
  await expect(toast).toBeVisible({ timeout: 10000 });
  await expect(mailbox.locator(".game-navigation__unread")).toHaveText("1");
  await toast
    .getByRole("button", { name: /有新的旅途来信.*你有 1 封未读来信/ })
    .click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(
    page.locator(".mailbox-row").filter({ hasText: "新的远方来信" }),
  ).toHaveAttribute("data-read", "false");
  expect(receipts).toBe(0);
});
