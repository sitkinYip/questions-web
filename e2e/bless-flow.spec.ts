import { expect, test } from "@playwright/test";
import {
  mockLegacyAudioPlayback,
  mockQuestionsApi,
  pocketBaseList,
} from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockQuestionsApi(page);
});

test("plays Bless music, narration and credits with a legacy play return", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockLegacyAudioPlayback(page);
  await page.route("**/api/collections/phrase/records**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        pocketBaseList([
          {
            id: "phrase-final",
            from: "final",
            title: "点击开启你的专属星空",
            phraseList: [
              {
                text: "愿星光照亮前路",
                audio: "https://assets.example/voice.mp3",
                duration: 40,
              },
            ],
            takeABowList: [
              {
                text: "第一句谢幕",
                audio: "https://assets.example/credits.mp3",
                duration: 40,
              },
              { text: "旅途仍在继续", duration: 40 },
            ],
            mainAudio: "https://assets.example/bless-bgm.mp3",
            updated: "2026-08-25 10:00:00.000Z",
          },
        ]),
      ),
    }),
  );
  await page.goto("/bless?from=final");
  await page.getByRole("button", { name: "点击开启你的专属星空" }).click();
  await page.getByRole("button", { name: "暂停背景音乐" }).click();
  await page.getByRole("button", { name: "播放背景音乐" }).click();
  await expect(
    page.getByRole("button", { name: "暂停背景音乐" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "开始播放" }).click();
  await expect(page.getByText("旅途仍在继续")).toHaveClass("is-active");
  expect(errors).toEqual([]);
});

test("opens the in-app Bless experience and returns to qa=42", async ({
  page,
}) => {
  await page.goto("/bless?from=final&returnTo=%2F%3Fqa%3D42");

  await expect(
    page.getByRole("button", { name: "点击开启你的专属星空" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "返回冒险" })).toHaveAttribute(
    "href",
    "/?qa=42",
  );

  await page.getByRole("button", { name: "点击开启你的专属星空" }).click();
  await expect(page.getByRole("button", { name: /背景音乐/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "星空谢幕" })).toBeVisible({
    timeout: 3_000,
  });

  await page.getByRole("link", { name: "返回冒险" }).click();
  await expect(page).toHaveURL(/\/\?qa=42$/);
});

test("rejects an external Bless return target", async ({ page }) => {
  await page.goto(
    "/bless?from=final&returnTo=https%3A%2F%2Fevil.example%2Fescape",
  );
  await expect(page.getByRole("link", { name: "返回冒险" })).toHaveCount(0);
});

test("recognizes Bless when a root build is served below questions-next", async ({
  page,
}) => {
  await page.goto(
    "/questions-next/bless?from=final&returnTo=%2Fquestions-next%2F%3Fqa%3D52",
  );

  await expect(
    page.getByRole("button", { name: "点击开启你的专属星空" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "返回冒险" })).toHaveAttribute(
    "href",
    "/questions-next/?qa=52",
  );
  await expect(
    page.getByRole("heading", { name: "没有找到对应题目" }),
  ).toHaveCount(0);
});
