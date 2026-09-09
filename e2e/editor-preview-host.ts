import { expect, type Page } from "@playwright/test";
import type { EditorPreviewDraft } from "@/api/game.contracts";
export async function editorPreviewHost(
  page: Page,
  width: number,
  kind: string,
) {
  const requests: string[] = [],
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const writes: string[] = [];
    Object.assign(window, { previewStorageWrites: writes });
    Storage.prototype.setItem = function (key, _value) {
      writes.push(key);
      throw new Error(`Unexpected preview storage write: ${key}`);
    };
  });
  await page.route("**/api/**", (route) => {
    if (new URL(route.request().url()).pathname.startsWith("/src/"))
      return route.continue();
    requests.push(route.request().url());
    return route.abort();
  });
  await page.route("**/editor-preview-host", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><meta charset="UTF-8"><body style="margin:0"><iframe style="border:0;width:${width}px;height:660px" title="场次预览"></iframe><script>
 const frame=document.querySelector('iframe');
 addEventListener('message',e=>{if(e.origin===location.origin && e.source===frame.contentWindow && e.data.type==='sitkin:preview:ready')document.body.dataset.ready=String(e.data.kinds.includes('${kind}'));});
 frame.src='/preview/?parentOrigin='+encodeURIComponent(location.origin)+'&channel=session-test';</script>`,
    }),
  );
  await page.goto("/editor-preview-host");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  let revision = 0;
  const send = async (
    draft: EditorPreviewDraft,
    reset = 0,
    theme = "light",
  ) => {
    await page.evaluate(
      (payload: string) =>
        document
          .querySelector("iframe")!
          .contentWindow!.postMessage(JSON.parse(payload), location.origin),
      JSON.stringify({
        type: "sitkin:preview:update",
        version: 1,
        channel: "session-test",
        revision: ++revision,
        reset,
        theme,
        state: "unread",
        draft,
      }),
    );
  };
  const frame = page.frameLocator("iframe");
  const verify = async () => {
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
    expect(
      await frame
        .locator("body")
        .evaluate(
          () =>
            (window as unknown as { previewStorageWrites: string[] })
              .previewStorageWrites,
        ),
    ).toEqual([]);
  };
  return { frame, send, requests, errors, verify };
}
