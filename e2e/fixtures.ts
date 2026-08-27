import type { Page, Route } from "@playwright/test";

export const levels = [
  {
    id: "level-11",
    step: 11,
    type: "FillInTheBlank",
    title: "星辰之门",
    userName: "远航者",
    avatar: "https://assets.example/avatar.svg",
    mainBgImg: "https://assets.example/background.svg",
    question: [
      {
        text: "请输入星辰大海",
        img: "https://assets.example/constellation.png",
        imgList: [
          "https://assets.example/constellation-detail-1.png",
          "https://assets.example/constellation-detail-2.png",
        ],
      },
    ],
    answer: "星辰大海",
    answerList: ["星辰，大海"],
    options: [],
    thread: [
      { type: "text", content: "[[第一段线索]]" },
      {
        type: "letter",
        title: "藏在柜子的一封信",
        content: "[[关于初见的故事]]\n先去打开柜子，再看看这封信。",
        path: "/letter",
        query: { from: "e2e-theme" },
      },
    ],
    updated: "2026-08-25 10:00:00.000Z",
  },
  {
    id: "level-12",
    step: 12,
    type: "MultipleChoice",
    title: "守门人的选择",
    question: [{ text: "请选择正确星象" }],
    answer: "B",
    answerList: [],
    options: [
      { key: "A", text: "月亮" },
      { key: "B", text: "北极星" },
    ],
    penaltyConfig: [60_000, -1],
    thread: [{ type: "text", content: "第二段线索" }],
    updated: "2026-08-25 10:00:00.000Z",
  },
];

export function pocketBaseList(items: unknown[]) {
  return {
    items,
    page: 1,
    perPage: 500,
    totalItems: items.length,
    totalPages: items.length ? 1 : 0,
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
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

export async function mockQuestionsApi(page: Page) {
  await page.route("**/api/collections/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.includes("/levels/records")) {
      await fulfillJson(route, pocketBaseList(levels));
      return;
    }
    if (pathname.includes("/multi_quest_clues/records")) {
      await fulfillJson(
        route,
        pocketBaseList([
          {
            id: "combined-11-12",
            qas: "11,12",
            title: "星辰组合真相",
            content: "[[本场线索已经解锁]]",
            buttonText: "收下线索",
            desc: "两道谜题的共同答案",
            updated: "2026-08-25 10:00:00.000Z",
          },
        ]),
      );
      return;
    }
    if (pathname.includes("/notifications/records")) {
      await fulfillJson(route, { items: [] });
      return;
    }
    if (pathname.includes("/phrase/records")) {
      await fulfillJson(
        route,
        pocketBaseList([
          {
            id: "phrase-final",
            from: "final",
            title: "点击开启你的专属星空",
            phraseList: [{ text: "愿星光照亮前路", duration: 40 }],
            takeABowList: [{ text: "旅途仍在继续", duration: 40 }],
            mainAudio: "https://assets.example/bless-bgm.mp3",
            updated: "2026-08-25 10:00:00.000Z",
          },
        ]),
      );
      return;
    }
    await route.abort();
  });
  await page.route("https://assets.example/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#d4bc7d"/></svg>',
    }),
  );
}
