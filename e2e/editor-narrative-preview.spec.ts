import { expect, test, type Page } from "@playwright/test";
import type { EditorPreviewMessage } from "@/api/game.contracts";

async function host(page: Page, width: number) {
  const apiRequests: string[] = [];
  await page.route("**/api/**", (route) => {
    if (new URL(route.request().url()).pathname.startsWith("/src/"))
      return route.continue();
    apiRequests.push(route.request().url());
    return route.abort();
  });
  await page.route("**/editor-preview-host", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><meta charset="UTF-8"><body style="margin:0"><iframe style="border:0;width:${width}px;height:720px" title="剧情预览"></iframe><script>
    const iframe = document.querySelector('iframe');
    window.addEventListener('message', event => { if(event.origin === location.origin && event.source === iframe.contentWindow && event.data.type === 'sitkin:preview:ready') document.body.dataset.ready = event.data.kinds.includes('narrative') ? 'true' : 'false'; });
    iframe.src = '/preview/?parentOrigin=' + encodeURIComponent(location.origin) + '&channel=narrative-test';
  </script>`,
    }),
  );
  await page.goto("/editor-preview-host");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  let revision = 0;
  const send = async (draft: EditorPreviewMessage["draft"], reset = 0) => {
    const message: EditorPreviewMessage = {
      type: "sitkin:preview:update",
      version: 1,
      channel: "narrative-test",
      revision: ++revision,
      reset,
      theme: "light",
      state: "unread",
      draft,
    };
    await page.evaluate(
      (payload: string) =>
        document
          .querySelector("iframe")!
          .contentWindow!.postMessage(JSON.parse(payload), location.origin),
      JSON.stringify(message),
    );
  };
  return { frame: page.frameLocator("iframe"), send, apiRequests };
}
for (const [variant, width] of [
  ["modern", 320],
  ["classical", 390],
  ["magic", 1200],
] as const) {
  test(`${variant} narrative resets an opened letter on edit and manual reset at ${width}px`, async ({
    page,
  }) => {
    const { frame, send, apiRequests } = await host(page, width);
    const draft: Extract<EditorPreviewMessage["draft"], { kind: "narrative" }> =
      {
        kind: "narrative",
        value: {
          id: "draft",
          kind: "letter",
          title: "预览来信",
          payload: {
            variant,
            hintText: "开启剧情",
            typingSpeedMs: 60,
            paragraphs: [
              {
                content: "原来的剧情文字。".repeat(15),
                delayMs: 0,
                align: "left",
              },
            ],
          },
        },
      };
    await send(draft);
    await expect(frame.locator(".letter-page")).toHaveClass(/is-sealed/);
    await frame.getByRole("button", { name: /开启剧情/ }).click();
    await expect(frame.locator(".letter-page")).toHaveClass(/is-open/);
    const next = {
      ...draft,
      value: {
        ...draft.value,
        title: "修改后的来信",
        payload: {
          ...draft.value.payload,
          paragraphs: [{ content: "更新后的剧情", delayMs: 0, align: "left" }],
        },
      },
    };
    await send(next);
    await expect(frame.locator(".letter-page")).toHaveClass(/is-sealed/);
    await frame.getByRole("button", { name: /开启剧情/ }).click();
    await frame.getByRole("button", { name: "显示全文" }).click();
    await expect(frame.locator(".letter-paper-current")).toContainText(
      "更新后的剧情",
    );
    await send(next, 1);
    await expect(frame.locator(".letter-page")).toHaveClass(/is-sealed/);
    const metrics = await frame.locator("body").evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.width);
    expect(apiRequests).toEqual([]);
  });
}
test("blessing preview returns to start on edits and handles an empty draft", async ({
  page,
}) => {
  const { frame, send, apiRequests } = await host(page, 390);
  const draft: Extract<EditorPreviewMessage["draft"], { kind: "narrative" }> = {
    kind: "narrative",
    value: {
      id: "draft",
      kind: "bless",
      title: "开始祝福",
      payload: {
        phrases: [{ text: "一路顺风", durationMs: 3000 }],
        closingLines: [{ text: "祝福结束", durationMs: 1000 }],
      },
    },
  };
  await send(draft);
  await frame.getByRole("button", { name: "开始祝福" }).click();
  await expect(frame.locator(".bless-start")).toHaveCount(0);
  await send({ ...draft, value: { ...draft.value, title: "新的祝福" } });
  await expect(frame.getByRole("button", { name: "新的祝福" })).toBeVisible();
  await send({
    ...draft,
    value: { ...draft.value, payload: { phrases: [], closingLines: [] } },
  });
  await expect(frame.getByRole("status")).toContainText("添加至少一句祝福");
  expect(apiRequests).toEqual([]);
});
