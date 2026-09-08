import { expect, type Page, type Route } from "@playwright/test";
import type {
  GameAssignment,
  GamePlayer,
  GameQuestion,
  GameClue,
} from "@/api/game.contracts";

const block = {
  text: "请输入星辰大海",
  hint: "",
  imageUrl: "https://assets.example/constellation.png",
  imageUrls: ["https://assets.example/detail.png"],
  videoUrl: "",
};
export const questions: GameQuestion[] = [
  {
    id: "question11",
    kind: "text",
    title: "星辰之门",
    placeholder: "输入你的答案",
    content: [block],
    options: [],
  },
  {
    id: "question12",
    kind: "choice",
    title: "守门人的选择",
    placeholder: "",
    content: [
      { ...block, text: "请选择正确星象", imageUrl: "", imageUrls: [] },
    ],
    options: [
      { key: "A", text: "月亮", imageUrl: "", videoUrl: "" },
      { key: "B", text: "北极星", imageUrl: "", videoUrl: "" },
    ],
  },
];
export async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}
/** UI fixtures only. Permission, transaction and concurrency tests use real PB separately. */
export async function mockQuestionsApi(
  page: Page,
  options: {
    single?: boolean;
    mustChange?: boolean;
    bgm?: boolean;
    autoNext?: boolean;
    autoClue?: boolean;
    count?: number;
    completed?: boolean;
    notifications?: boolean;
    finale?: boolean;
  } = {},
) {
  const player: GamePlayer = {
    id: "playeralice",
    account: "alice",
    displayName: "远航者",
    avatar: "",
    mustChangePassword: options.mustChange || false,
    totalXp: 0,
    level: {
      id: "rank1",
      order: 1,
      name: "初见",
      minTotalXp: 0,
      visualConfig: {},
    },
    nextLevel: null,
  };
  const content = options.count
    ? Array.from({ length: options.count }, (_, i) => ({
        ...questions[0],
        id: `question${i}`,
        title: `导航测试第 ${i + 1} 题`,
      }))
    : options.single
      ? [questions[0]]
      : questions;
  const assignment: GameAssignment = {
    id: "assignment1",
    player: player.id,
    session: "session1",
    title: "星辰探险",
    description: "解开谜题，发现惊喜。",
    status: options.completed ? "completed" : "assigned",
    order: 0,
    startsAt: "",
    endsAt: "",
    startedAt: options.completed ? new Date().toISOString() : "",
    completedAt: "",
    previousAssignment: "",
    minLevel: 1,
    maxLevel: null,
    completedLevels: options.completed ? content.length : 0,
    totalLevels: content.length,
    presentation: {
      bgmMode: options.bgm ? "custom" : "silent",
      bgmUrl: options.bgm ? "https://assets.example/bgm.mp3" : "",
      backgroundUrl: "https://assets.example/background.svg",
      completionStyle: options.finale ? "finale" : "normal",
    },
    completionTarget: options.completed
      ? { kind: "narrative", id: "bless1" }
      : null,
    currentIndex: options.completed ? content.length - 1 : 0,
    serverTime: new Date().toISOString(),
    clues: [],
    levels: content.map((q, i) => ({
      id: `step${i}`,
      position: i + 1,
      xp: 50,
      autoNext: options.autoNext || false,
      completedAt: options.completed ? new Date().toISOString() : "",
      wrongCount: 0,
      cooldownUntil: "",
      locked: false,
      presentationOverride: {},
      question: options.completed ? q : null,
      lastAnswer: "",
    })),
  };
  const clue: GameClue = {
    id: "clue1",
    source: "session",
    definitionId: "clue1",
    question: "",
    sessionLevel: options.autoClue ? "step0" : "",
    trigger: options.autoClue ? "level_completed" : "session_completed",
    kind: "text",
    position: 0,
    narrative: "",
    autoPlay: Boolean(options.autoClue),
    unlockedAt: "",
    content: {
      title: "星辰组合真相",
      text: "本场线索已经解锁",
      url: "",
      imageUrls: [],
      buttonText: "收下线索",
    },
  };
  const notices = options.notifications
    ? [
        {
          id: "note1",
          title: "来自工作人员的消息",
          content: "请到入口领取下一份线索。",
          popupTitle: "远方来信",
          buttonText: "收到消息",
          sentAt: new Date().toISOString(),
          readAt: "",
          assignmentId: "assignment1",
        },
      ]
    : [];
  const receipts = new Map<string, unknown>();
  await page.route("**/api/collections/**", (route) => {
    if (route.request().url().includes("/game_players/auth-with-password"))
      return fulfillJson(route, {
        token: "ui-test-token",
        record: { id: player.id },
      });
    return fulfillJson(route, {}, 403);
  });
  await page.route("**/api/questions/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(
        "/api/questions/v1",
        "",
      ),
      method = route.request().method();
    const body = method === "POST" ? route.request().postDataJSON() : {};
    assignment.serverTime = new Date().toISOString();
    if (path === "/me") return fulfillJson(route, player);
    if (path === "/me/change-password") {
      player.mustChangePassword = false;
      return fulfillJson(route, { token: "ui-test-rotated-token", player });
    }
    if (path === "/notifications")
      return fulfillJson(route, { items: notices });
    if (path === "/notifications/note1/read") {
      notices[0].readAt = new Date().toISOString();
      return fulfillJson(route, { id: "note1", readAt: notices[0].readAt });
    }
    if (path === "/rewards") return fulfillJson(route, { items: [] });
    if (path === "/assignments")
      return fulfillJson(route, { items: [assignment] });
    if (path === "/assignments/assignment1")
      return fulfillJson(route, assignment);
    if (path.endsWith("/start")) {
      assignment.status = "active";
      assignment.startedAt = new Date().toISOString();
      assignment.levels[0].question = content[0];
      return fulfillJson(route, assignment);
    }
    if (path.endsWith("/answers")) {
      if (receipts.has(body.requestId))
        return fulfillJson(route, receipts.get(body.requestId));
      const index = assignment.levels.findIndex(
          (step) => step.id === body.sessionLevelId,
        ),
        step = assignment.levels[index];
      const correct =
        content[index].kind === "choice"
          ? body.answer === "B"
          : body.answer.replace(/[，,\s]/g, "") === "星辰大海";
      step.lastAnswer = body.answer;
      if (correct) {
        step.completedAt = new Date().toISOString();
        assignment.completedLevels++;
        player.totalXp += step.xp;
        if (index + 1 < content.length) {
          assignment.currentIndex = index + 1;
          assignment.levels[index + 1].question = content[index + 1];
        } else {
          assignment.status = "completed";
          assignment.completedAt = new Date().toISOString();
          assignment.completionTarget = { kind: "narrative", id: "bless1" };
        }
        if (options.autoClue || assignment.status === "completed")
          assignment.clues = [
            { ...clue, unlockedAt: new Date().toISOString() },
          ];
      } else {
        step.wrongCount++;
        step.cooldownUntil = new Date(Date.now() + 60000).toISOString();
      }
      const result = structuredClone({
        result: correct ? "correct" : "incorrect",
        xpDelta: correct ? step.xp : 0,
        rewardIds: [],
        assignment,
        player,
      });
      receipts.set(body.requestId, result);
      return fulfillJson(route, result);
    }
    if (
      path.endsWith("/narratives/bless1") &&
      assignment.status === "completed"
    )
      return fulfillJson(route, {
        id: "bless1",
        kind: "bless",
        title: "点击开启你的专属星空",
        payload: {
          phrases: [
            {
              text: "愿星光照亮前路",
              audioUrl: "https://assets.example/voice.mp3",
              durationMs: 40,
            },
          ],
          closingLines: [{ text: "旅途仍在继续", durationMs: 40 }],
          mainAudioUrl: "https://assets.example/bgm.mp3",
        },
      });
    return fulfillJson(
      route,
      { error: { code: "NOT_FOUND", message: "内容尚未解锁" } },
      404,
    );
  });
  await page.route("https://assets.example/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#d4bc7d"/></svg>',
    }),
  );
  return { player, assignment };
}
export async function login(page: Page, path = "/") {
  await page.goto(path);
  await page.getByLabel("登录账号", { exact: true }).fill("alice");
  await page.getByLabel("密码", { exact: true }).fill("Ui-test-password-123");
  await page.getByRole("button", { name: "进入冒险" }).click();
}
export async function enterGame(page: Page) {
  await login(page, "/play/assignment1");
  await page.getByRole("button", { name: "开始本场冒险" }).click();
  await expect(page.locator(".quest-card h1")).toBeVisible();
}

export async function mockLegacyAudioPlayback(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: function (this: HTMLMediaElement) {
        Object.defineProperty(this, "paused", {
          configurable: true,
          value: false,
        });
        this.dispatchEvent(new Event("play"));
        if (!this.loop) {
          window.setTimeout(() => {
            if (this.paused) return;
            Object.defineProperty(this, "paused", {
              configurable: true,
              value: true,
            });
            this.dispatchEvent(new Event("ended"));
          }, 50);
        }
        // Older media implementations start playback without returning a Promise.
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: function (this: HTMLMediaElement) {
        Object.defineProperty(this, "paused", {
          configurable: true,
          value: true,
        });
        this.dispatchEvent(new Event("pause"));
      },
    });
  });
}
