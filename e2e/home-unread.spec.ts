import { expect, test } from "@playwright/test";
import { makeNotifications, makeRewards } from "@/test/game-fixtures";
import { fulfillJson, login, mockStarwardApi } from "./fixtures";

test.describe("主页未读", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("查询聚合并按访问或清空更新角标，新到内容继续提醒", async ({ page }) => {
    const { assignment, player } = await mockStarwardApi(page);
    const assignments = [
      assignment,
      { ...assignment, id: "assignment2", title: "另一场星辰旅行" },
    ];
    const rewards = makeRewards().map((reward) => ({
      ...reward,
      player: player.id,
    }));
    const notifications = makeNotifications();
    const dedicatedReads: string[] = [];
    const reads: string[][] = [];
    let homeReads = 0;

    page.on("request", (request) => {
      const endpoint = new URL(request.url()).pathname;
      if (
        /\/api\/questions\/v1\/(assignments|rewards|notifications)$/.test(
          endpoint,
        )
      ) {
        dedicatedReads.push(endpoint);
      }
    });
    await page.route("**/api/questions/v1/home", (route) => {
      homeReads++;
      return fulfillJson(route, {
        assignments: { items: assignments },
        rewards: { items: rewards },
        notifications: { items: notifications },
      });
    });
    await page.route("**/api/questions/v1/notifications/read-all", (route) => {
      const { ids } = route.request().postDataJSON() as { ids: string[] };
      reads.push(ids);
      const receipts = notifications
        .filter((note) => ids.includes(note.id))
        .map((note) => {
          note.readAt ||= new Date().toISOString();
          return { id: note.id, readAt: note.readAt };
        });
      if (reads.length === 1) {
        notifications.push({
          ...notifications[0],
          id: "new-note",
          readAt: "",
          title: "刚到的来信",
        });
      }
      return fulfillJson(route, { items: receipts });
    });

    await login(page);
    const nav = page.getByRole("navigation", { name: "冒险导航" });
    const journey = nav.getByRole("link", { name: "启程", exact: true });
    const collection = nav.getByRole("link", { name: "收藏", exact: true });
    const mailbox = nav.getByRole("link", { name: "来信", exact: true });
    const clear = page.getByRole("button", { name: "清空未读" });
    await expect(journey).toHaveAttribute(
      "aria-description",
      "你有 2 个未访问场次。",
    );
    await expect(collection).toHaveAttribute(
      "aria-description",
      "你有 1 份未读奖品。",
    );
    await expect(mailbox).toHaveAttribute(
      "aria-description",
      "你有 1 封未读来信。",
    );
    const first = page.locator('.chapter-card a[href="/play/assignment1"]');
    await expect(first).toHaveAttribute("aria-description", "未访问场次");
    const ring = first.locator("..").locator(".chapter-card__unread-ring");
    await expect(ring).toHaveCSS("animation-name", "chapter-unread-breathe");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(ring).toHaveCSS("animation-name", "none");
    await expect(ring).toBeVisible();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await first.click();
    await expect(
      page.getByRole("button", { name: "开始本场冒险" }),
    ).toBeVisible();
    const homeBeforeReturning = homeReads;
    const mailReadsOnEntry = dedicatedReads.length;
    await expect
      .poll(() => dedicatedReads.length, { timeout: 8000 })
      .toBeGreaterThan(mailReadsOnEntry);
    expect(homeReads).toBe(homeBeforeReturning);
    expect(
      dedicatedReads.every((path) => path.endsWith("/notifications")),
    ).toBe(true);
    dedicatedReads.length = 0;
    await page.goBack();
    await expect.poll(() => homeReads).toBeGreaterThan(homeBeforeReturning);
    await expect(journey).toHaveAttribute(
      "aria-description",
      "你有 1 个未访问场次。",
    );
    await expect(first).not.toHaveAttribute("aria-description");
    await expect(ring).toHaveCount(0);
    await clear.click();
    await expect(clear).toHaveCount(0);
    await expect(journey).not.toHaveAttribute("aria-description");
    expect(assignment.status).toBe("assigned");

    await collection.click();
    const reward = page.getByRole("button", {
      name: `查看${rewards[0].snapshot.name}详情`,
    });
    await expect(reward).toHaveAttribute("aria-description", "未读奖品");
    await clear.click();
    await expect(clear).toHaveCount(0);
    await expect(reward).toBeVisible();
    await expect(collection).not.toHaveAttribute("aria-description");
    await page.reload();
    await expect(reward).toBeVisible();
    await expect(collection).not.toHaveAttribute("aria-description");
    rewards.push({
      ...rewards[0],
      id: "new-reward",
      snapshot: { ...rewards[0].snapshot, name: "新奖品" },
    });
    await expect(collection).toHaveAttribute(
      "aria-description",
      "你有 1 份未读奖品。",
      { timeout: 10_000 },
    );
    await expect(
      page.getByRole("button", { name: "查看新奖品详情" }),
    ).toHaveAttribute("aria-description", "未读奖品");

    await mailbox.click();
    await clear.click();
    await expect(page.getByText("刚到的来信", { exact: true })).toBeVisible();
    await expect(mailbox).toHaveAttribute(
      "aria-description",
      "你有 1 封未读来信。",
    );
    expect(reads).toEqual([[notifications[0].id]]);
    await clear.click();
    await expect(clear).toHaveCount(0);
    await expect(mailbox).not.toHaveAttribute("aria-description");
    await expect(page.getByText("刚到的来信", { exact: true })).toBeVisible();
    expect(reads).toEqual([[notifications[0].id], ["new-note"]]);
    expect(homeReads).toBeGreaterThan(1);
    expect(dedicatedReads).toEqual([]);
  });

  test("旧版服务使用逐封回执，失败后只重试剩余来信", async ({ page }) => {
    await mockStarwardApi(page);
    const notes = makeNotifications().map((note) => ({ ...note, readAt: "" }));
    const readIds: string[] = [];
    let failOnce = true;
    await page.route("**/api/questions/v1/notifications", (route) =>
      fulfillJson(route, { items: notes }),
    );
    await page.route("**/api/questions/v1/notifications/*/read", (route) => {
      const id = new URL(route.request().url()).pathname.split("/").at(-2);
      const note = notes.find((item) => item.id === id)!;
      readIds.push(note.id);
      if (note === notes[1] && failOnce) {
        failOnce = false;
        return fulfillJson(
          route,
          { error: { message: "这封来信暂时无法保存" } },
          409,
        );
      }
      note.readAt ||= new Date().toISOString();
      return fulfillJson(route, { readAt: note.readAt });
    });
    await login(page, "/notifications");
    const clear = page.getByRole("button", { name: "清空未读" });
    const mailbox = page.getByRole("link", { name: "来信", exact: true });
    await expect(mailbox).toHaveAttribute(
      "aria-description",
      "你有 2 封未读来信。",
    );
    await clear.click();
    await expect(page.getByText("这封来信暂时无法保存")).toBeVisible();
    await expect(mailbox).toHaveAttribute(
      "aria-description",
      "你有 1 封未读来信。",
    );
    await clear.click();
    await expect(mailbox).not.toHaveAttribute("aria-description");
    await expect(clear).toHaveCount(0);
    expect(readIds).toEqual([notes[0].id, notes[1].id, notes[1].id]);
  });
});
