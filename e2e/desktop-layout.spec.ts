import { expect, test, type Page } from "@playwright/test";
import {
  fulfillJson,
  login,
  mockLegacyAudioPlayback,
  mockQuestionsApi,
  questions,
} from "@e2e/fixtures";
import { desktopAssignment, desktopLetter } from "@e2e/desktop-preview-data";
import { makeNotifications } from "@/test/game-fixtures";

async function expectPageFits(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        horizontal: document.documentElement.scrollWidth > innerWidth + 1,
        vertical: document.documentElement.scrollHeight > innerHeight + 1,
      })),
    )
    .toEqual({ horizontal: false, vertical: false });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 720 });
});

test("desktop login help does not move or resize the celestial artwork", async ({
  page,
}) => {
  await page.goto("/login?theme=light");
  const artwork = page.locator(".game-auth__story");
  const atlas = page.locator(".game-auth__story > .celestial-atlas");
  const copy = page.locator(".game-auth__story-copy");

  const documentRect = (selector: string) =>
    page.locator(selector).evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      };
    });

  const before = {
    artwork: await documentRect(".game-auth__story"),
    atlas: await documentRect(".game-auth__story > .celestial-atlas"),
    copy: await documentRect(".game-auth__story-copy"),
  };

  await page.getByText("还没有账号，或忘记了密码？", { exact: true }).click();

  await expect(page.locator(".game-auth__help")).toHaveAttribute("open", "");
  const after = {
    artwork: await documentRect(".game-auth__story"),
    atlas: await documentRect(".game-auth__story > .celestial-atlas"),
    copy: await documentRect(".game-auth__story-copy"),
  };
  expect(after).toEqual(before);
  expect(Math.abs(after.atlas.width - after.atlas.height)).toBeLessThanOrEqual(
    1,
  );
  await expect(artwork).toBeVisible();
  await expect(atlas).toBeVisible();
  await expect(copy).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});

async function expectProfileActionsAligned(page: Page) {
  // Measure the resting layout, not the hovered button's intentional lift.
  await page.mouse.move(0, 0);
  const actions = page.locator(".desktop-profile .game-cta");
  await expect(actions).toHaveCount(2);
  await expect
    .poll(() =>
      actions.evaluateAll((buttons) => {
        const [left, right] = buttons.map((button) =>
          button.getBoundingClientRect(),
        );
        return Math.max(
          Math.abs(left.top - right.top),
          Math.abs(left.bottom - right.bottom),
        );
      }),
    )
    .toBeLessThanOrEqual(1);
}

test("desktop profile exposes both editors at laptop sizes and retains drafts across the boundary", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await login(page, "/profile");
  for (const size of [
    { width: 1100, height: 700 },
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(size);
    await expect(page.locator(".game-world")).toHaveAttribute(
      "data-desktop",
      "profile",
    );
    await expect(page.getByRole("button", { name: "保存资料" })).toBeInViewport(
      { ratio: 1 },
    );
    await expect(
      page.getByRole("button", { name: "保存新密码" }),
    ).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole("tab", { name: "账号安全" })).toHaveCount(0);
    await expectProfileActionsAligned(page);
    await expectPageFits(page);
  }
  await page.getByLabel("显示昵称", { exact: true }).fill("未保存的旅人");
  await page.getByLabel("新密码", { exact: true }).fill("private-local-draft");
  await page.getByLabel("上传头像").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  const preview = await page
    .locator(".profile-editor__avatar img")
    .getAttribute("src");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("tab", { name: "我的名片" })).toBeVisible();
  await expect(page.getByLabel("显示昵称", { exact: true })).toHaveValue(
    "未保存的旅人",
  );
  await expect(page.locator(".profile-editor__avatar img")).toHaveAttribute(
    "src",
    preview!,
  );
  await page.getByRole("tab", { name: "账号安全" }).click();
  await expect(page.getByLabel("新密码", { exact: true })).toHaveValue(
    "private-local-draft",
  );
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByLabel("显示昵称", { exact: true })).toHaveValue(
    "未保存的旅人",
  );
  await expect(page.getByLabel("新密码", { exact: true })).toHaveValue(
    "private-local-draft",
  );
  await expect(page.locator(".profile-editor__avatar img")).toHaveAttribute(
    "src",
    preview!,
  );
});

test("desktop profile save buttons stay aligned when either editor shows feedback", async ({
  page,
}) => {
  const { player } = await mockQuestionsApi(page);
  await page.route("**/api/questions/v1/me/profile", (route) =>
    fulfillJson(route, { ...player, displayName: "更新后的旅人" }),
  );
  await login(page, "/profile?theme=light");
  await expectProfileActionsAligned(page);

  await page
    .getByLabel("当前密码", { exact: true })
    .fill("current-test-password");
  await page.getByLabel("新密码", { exact: true }).fill("new-test-password");
  await page
    .getByLabel("确认新密码", { exact: true })
    .fill("different-test-password");
  await page.getByRole("button", { name: "保存新密码" }).click();
  await expect(page.locator("#password-validation")).toBeVisible();
  await expectProfileActionsAligned(page);

  await page.getByLabel("上传头像").setInputFiles({
    name: "bad.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg />"),
  });
  await expect(page.locator(".profile-editor [role=alert]")).toBeVisible();
  await expectProfileActionsAligned(page);

  await page.getByLabel("显示昵称", { exact: true }).fill("更新后的旅人");
  await page.getByRole("button", { name: "保存资料" }).click();
  await expect(page.locator(".profile-editor [role=status]")).toContainText(
    "资料已保存",
  );
  await expectProfileActionsAligned(page);
  await expectPageFits(page);
});

test("desktop keeps unlocked clues beside the current question, without revealing locked content", async ({
  page,
}) => {
  const { assignment } = await mockQuestionsApi(page);
  Object.assign(assignment, structuredClone(desktopAssignment), {
    id: "assignment1",
    player: "playeralice",
  });
  await login(page, "/play/assignment1");
  const shelf = page.getByRole("complementary", { name: "线索手记" });
  await expect(shelf).toBeVisible();
  const card = await page.locator(".desktop-question").boundingBox();
  const clues = await shelf.boundingBox();
  expect(card!.x + card!.width).toBeLessThan(clues!.x);
  await expect
    .poll(async () => {
      const questionBox = await page.locator(".desktop-question").boundingBox();
      const clueBox = await shelf.boundingBox();
      return Math.abs(questionBox!.y - clueBox!.y);
    })
    .toBeLessThan(2);
  await expect(page.getByRole("button", { name: "提交答案" })).toBeInViewport({
    ratio: 1,
  });
  await expect(page.getByRole("button", { name: "03 第 3 题" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "最后一枚星印" })).toHaveCount(
    0,
  );
  await expect(page.getByLabel("答题引导")).toHaveCount(0);
  await page.getByRole("radio", { name: "B 北极星" }).check();
  await page
    .getByRole("button", { name: "旧观测台的罗盘", exact: true })
    .click();
  await page.getByRole("button", { name: "放大线索图片 1" }).click();
  await expect(page.getByRole("dialog", { name: "图片预览" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "守夜人的手记", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "守夜人的手记" }),
  ).toContainText("北方一直在那里");
  await expectPageFits(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(shelf).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "B 北极星" })).toBeChecked();
  await expect(page.locator(".quest-card > .quest-content")).toBeVisible();
});

test("desktop clue index follows the auto-selected unlocked clue", async ({
  page,
}) => {
  const { assignment } = await mockQuestionsApi(page);
  Object.assign(assignment, structuredClone(desktopAssignment), {
    id: "assignment1",
    player: "playeralice",
  });
  assignment.clues = Array.from({ length: 8 }, (_, index) => ({
    ...structuredClone(desktopAssignment.clues[2]),
    id: `overflow-clue-${index + 1}`,
    definitionId: `overflow-clue-${index + 1}`,
    position: index,
    content: {
      ...structuredClone(desktopAssignment.clues[2].content),
      title: `自动解锁线索 ${index + 1}`,
    },
  }));

  await login(page, "/play/assignment1");
  const index = page.getByRole("navigation", { name: "已解锁线索" });
  await expect(index.locator('[aria-pressed="true"]')).toContainText(
    "自动解锁线索 8",
  );
  await expect
    .poll(() =>
      index.evaluate((element) => {
        const selected = element.querySelector<HTMLElement>(
          '[aria-pressed="true"]',
        );
        if (!selected) return null;
        const indexRect = element.getBoundingClientRect();
        const selectedRect = selected.getBoundingClientRect();
        return {
          overflow: element.scrollWidth > element.clientWidth,
          scrolled: element.scrollLeft > 0,
          selectedVisible:
            selectedRect.left >= indexRect.left &&
            selectedRect.right <= indexRect.right,
        };
      }),
    )
    .toEqual({ overflow: true, scrolled: true, selectedVisible: true });
});

test("completed desktop prioritizes narrative jumps and keeps the combined archive draggable", async ({
  page,
}) => {
  await mockLegacyAudioPlayback(page);
  const { assignment } = await mockQuestionsApi(page);
  Object.assign(assignment, structuredClone(desktopAssignment), {
    id: "assignment1",
    player: "playeralice",
    status: "completed",
    completedLevels: desktopAssignment.totalLevels,
    currentIndex: desktopAssignment.totalLevels - 1,
    completedAt: new Date().toISOString(),
    presentation: {
      ...desktopAssignment.presentation,
      bgmMode: "custom",
      bgmUrl: "https://assets.example/archive.mp3",
    },
  });
  assignment.levels.forEach((level) => {
    level.completedAt = new Date().toISOString();
  });
  const regularClues = Array.from({ length: 9 }, (_, index) => ({
    ...structuredClone(desktopAssignment.clues[2]),
    id: `completed-clue-${index + 1}`,
    definitionId: `completed-clue-${index + 1}`,
    position: index < 3 ? index : index + 2,
    content: {
      ...structuredClone(desktopAssignment.clues[2].content),
      title: `普通线索 ${index + 1}`,
    },
  }));
  assignment.clues = [
    ...regularClues,
    {
      ...structuredClone(desktopAssignment.clues[2]),
      id: "completed-letter",
      definitionId: "completed-letter",
      kind: "letter",
      position: 3,
      narrative: "letter-finale",
      content: {
        ...structuredClone(desktopAssignment.clues[2].content),
        title: "终章来信",
      },
    },
    {
      ...structuredClone(desktopAssignment.clues[2]),
      id: "completed-bless",
      definitionId: "completed-bless",
      kind: "bless",
      position: 4,
      narrative: "bless-finale",
      content: {
        ...structuredClone(desktopAssignment.clues[2].content),
        title: "终章祝福",
      },
    },
    {
      ...structuredClone(desktopAssignment.clues[2]),
      id: "combined-archive",
      definitionId: "combined-archive",
      sessionLevel: "",
      trigger: "session_completed",
      kind: "text",
      position: 20,
      content: {
        title: "完整旅途档案",
        text: "所有谜题的答案在这里汇合。",
        url: "",
        imageUrls: [],
        buttonText: "收好档案",
      },
    },
  ];

  await login(page, "/play/assignment1");
  const index = page.getByRole("navigation", { name: "已解锁线索" });
  const letter = index.getByRole("button", { name: /终章来信/ });
  const blessing = index.getByRole("button", { name: /终章祝福/ });
  await expect
    .poll(async () => {
      const indexRect = await index.boundingBox();
      const letterRect = await letter.boundingBox();
      const blessingRect = await blessing.boundingBox();
      if (!indexRect || !letterRect || !blessingRect) return false;
      return [letterRect, blessingRect].every(
        (rect) =>
          rect.x >= indexRect.x &&
          rect.x + rect.width <= indexRect.x + indexRect.width,
      );
    })
    .toBe(true);

  const launcher = page.getByRole("button", { name: "查看本场线索" });
  const music = page.getByRole("button", { name: "暂停背景音乐" });
  await expect(launcher).toBeVisible();
  const [launcherRect, musicRect] = await Promise.all([
    launcher.boundingBox(),
    music.boundingBox(),
  ]);
  expect(launcherRect).not.toBeNull();
  expect(musicRect).not.toBeNull();
  expect(
    launcherRect!.x < musicRect!.x + musicRect!.width &&
      launcherRect!.x + launcherRect!.width > musicRect!.x &&
      launcherRect!.y < musicRect!.y + musicRect!.height &&
      launcherRect!.y + launcherRect!.height > musicRect!.y,
  ).toBe(false);

  await page.mouse.move(
    launcherRect!.x + launcherRect!.width / 2,
    launcherRect!.y + launcherRect!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(36, 360, { steps: 6 });
  await page.mouse.up();
  await expect(launcher).toHaveAttribute("data-horizontal", "left");
  await expect(page.getByRole("dialog", { name: "完整旅途档案" })).toHaveCount(
    0,
  );

  await launcher.click();
  const archive = page.getByRole("dialog", { name: "完整旅途档案" });
  await expect(archive).toContainText("所有谜题的答案在这里汇合");
  await archive.getByRole("button", { name: "收好档案" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(launcher).toBeInViewport({ ratio: 1 });
  await expect(music).toBeInViewport({ ratio: 1 });
  const [mobileLauncherRect, mobileMusicRect] = await Promise.all([
    launcher.boundingBox(),
    music.boundingBox(),
  ]);
  expect(
    mobileLauncherRect!.x < mobileMusicRect!.x + mobileMusicRect!.width &&
      mobileLauncherRect!.x + mobileLauncherRect!.width > mobileMusicRect!.x &&
      mobileLauncherRect!.y < mobileMusicRect!.y + mobileMusicRect!.height &&
      mobileLauncherRect!.y + mobileLauncherRect!.height > mobileMusicRect!.y,
  ).toBe(false);
});

test("desktop question growth stays inside its reading and answer panes", async ({
  page,
}) => {
  const { assignment } = await mockQuestionsApi(page);
  Object.assign(assignment, structuredClone(desktopAssignment), {
    id: "assignment1",
    player: "playeralice",
  });
  assignment.levels[1].question!.content[0].hint =
    "提示只应扩展题目阅读区。\n\n".repeat(40);
  await login(page, "/play/assignment1");
  await expect(page.locator(".desktop-question")).toBeVisible();
  await expect(page.locator(".desktop-clues")).toBeVisible();

  const stablePanels = () =>
    page
      .locator(".quest-desktop__workspace, .desktop-question, .desktop-clues")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          };
        }),
      );
  const before = await stablePanels();

  await page.getByText("查看提示", { exact: true }).click();
  await expect(page.locator(".quest-hint")).toHaveAttribute("open", "");
  expect(await stablePanels()).toEqual(before);
  expect(
    await page
      .locator(".desktop-question__reading")
      .evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true);

  await page.getByRole("radio", { name: "A 启明星" }).check();
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(page.getByText("回答错误，已进入惩罚时间。")).toBeVisible();
  expect(await stablePanels()).toEqual(before);
  await expect(page.getByRole("button", { name: "提交答案" })).toBeInViewport({
    ratio: 1,
  });
  await expectPageFits(page);
});

test("long questions scroll independently while the answer action stays visible", async ({
  page,
}) => {
  const { assignment } = await mockQuestionsApi(page, { single: true });
  assignment.status = "active";
  assignment.startedAt = new Date().toISOString();
  assignment.levels[0].question = structuredClone(questions[0]);
  assignment.levels[0].question.content[0].text =
    "沿着微光继续探索。\n\n".repeat(70);
  await login(page, "/play/assignment1");
  await expect(page.locator(".desktop-question")).toBeVisible();
  await expect(page.locator(".desktop-clues")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "提交答案" })).toBeInViewport({
    ratio: 1,
  });
  const reading = page.locator(".desktop-question__reading");
  expect(
    await reading.evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  await reading.focus();
  await page.keyboard.press("End");
  await expect
    .poll(() => reading.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await expectPageFits(page);
  await page.getByPlaceholder("输入你的答案").fill("桌面草稿");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByPlaceholder("输入你的答案")).toHaveValue("桌面草稿");
});

test("many choices scroll inside the answer area without hiding submit", async ({
  page,
}) => {
  const { assignment } = await mockQuestionsApi(page);
  Object.assign(assignment, structuredClone(desktopAssignment), {
    id: "assignment1",
    player: "playeralice",
  });
  assignment.levels[1].question!.options = Array.from(
    { length: 20 },
    (_, i) => ({
      key: String(i),
      text: `备选星象 ${i + 1}`,
      imageUrl: "",
      videoUrl: "",
    }),
  );
  await login(page, "/play/assignment1");
  await expect(page.getByRole("button", { name: "提交答案" })).toBeInViewport({
    ratio: 1,
  });
  expect(
    await page
      .locator(".desktop-question fieldset")
      .evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  await expect(
    page.getByRole("heading", { name: "星图上的北方" }),
  ).toBeInViewport();
  await expectPageFits(page);
});

test("desktop inbox keeps long lists and bodies local, and acknowledging does not jump selection", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  const notes = Array.from({ length: 25 }, (_, i) => ({
    ...makeNotifications()[0],
    id: `note-${i}`,
    title: `第 ${i + 1} 封来信`,
    content: i === 1 ? "第二封信的正文" : "旅途中的长信。\n\n".repeat(50),
  }));
  await page.route("**/api/questions/v1/notifications", (route) =>
    fulfillJson(route, { items: notes }),
  );
  await page.route("**/api/questions/v1/notifications/note-1/read", (route) => {
    notes[1].readAt = new Date().toISOString();
    return fulfillJson(route, {});
  });
  await login(page, "/notifications");
  const message = page.locator(".notification-letter__message");
  await expect(page.getByRole("button", { name: "收到消息" })).toBeInViewport({
    ratio: 1,
  });
  expect(
    await message.evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  expect(
    await page
      .locator(".desktop-inbox__list")
      .evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  await message.focus();
  await page.keyboard.press("End");
  await expect
    .poll(() => message.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: /^第 2 封来信 / }).click();
  await page.getByRole("button", { name: "收到消息" }).click();
  await expect(
    page.getByRole("heading", { name: "第 2 封来信" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("来信已收好");
  await expect(message).toHaveText("第二封信的正文");
  await expectPageFits(page);
});

for (const variant of ["modern", "classical", "magic"] as const) {
  test(`desktop ${variant} letter fits, paginates and keeps direct return visible`, async ({
    page,
  }) => {
    await mockQuestionsApi(page);
    await page.route(
      "**/api/questions/v1/assignments/assignment1/narratives/desktop-letter",
      (route) =>
        fulfillJson(route, {
          id: "desktop-letter",
          kind: "letter",
          title: desktopLetter.title,
          payload: {
            ...desktopLetter,
            variant,
            paragraphs: [
              ...desktopLetter.paragraphs,
              ...desktopLetter.paragraphs,
              ...desktopLetter.paragraphs,
            ],
          },
        }),
    );
    await login(page, "/play/assignment1/content/desktop-letter");
    await page.getByRole("button", { name: /轻触信封/ }).click();
    await page.getByRole("button", { name: "显示全文" }).click();
    await expect(
      page.getByRole("link", { name: "返回冒险", exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole("button", { name: "下一页" })).toBeInViewport({
      ratio: 1,
    });
    const reader = await page.locator(".letter-reader").boundingBox();
    expect(reader!.y).toBeGreaterThanOrEqual(24);
    expect(reader!.y + reader!.height).toBeLessThanOrEqual(720 - 24);
    await expectPageFits(page);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".letter-page-navigation span")).toContainText(
      "2 /",
    );
    const paragraphs = page.locator(".letter-paper-current .letter-paragraphs");
    await expect
      .poll(() =>
        paragraphs.evaluate(
          (el) =>
            el.scrollHeight <= el.clientHeight + 1 &&
            el.scrollWidth <= el.clientWidth + 1,
        ),
      )
      .toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".letter-desktop-guide")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "收起信件" })).toBeVisible();
  });
}
