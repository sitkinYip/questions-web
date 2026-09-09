import { expect, test } from "@playwright/test";
import { fulfillJson, login, mockQuestionsApi } from "@e2e/fixtures";
import { makeNotifications, makeRewards } from "@/test/game-fixtures";

test("mobile login keeps the primary action visible and theme controls named", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login?theme=dark");
  await expect(page.getByRole("button", { name: "进入冒险" })).toBeInViewport();
  await page.getByRole("radio", { name: "浅色", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("密码", { exact: true }).fill("local-test-only");
  await page.getByRole("button", { name: "显示密码" }).click();
  await expect(page.getByLabel("密码", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "隐藏密码" }).click();
  await expect(page.getByLabel("密码", { exact: true })).toHaveValue(
    "local-test-only",
  );
});

test("lobby filters history and reflects changing availability", async ({
  page,
}) => {
  const { assignment } = await mockQuestionsApi(page);
  assignment.startsAt = new Date(Date.now() + 60000).toISOString();
  await login(page);
  await expect(page.getByText("静候启程", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: /旅途回响/ }).click();
  await expect(
    page.getByRole("heading", { name: "故事的第一页，还空着。" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /待赴之约/ }).click();
  assignment.startsAt = "";
  await expect(page.getByText("可以出发", { exact: true })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("link", { name: "开启旅程" }).click();
  await expect(page.getByRole("heading", { name: "星辰探险" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "开始本场冒险" }),
  ).toBeEnabled();
});

test("assignment briefing disables start before the opening time", async ({
  page,
}) => {
  const { assignment } = await mockQuestionsApi(page);
  assignment.startsAt = new Date(Date.now() + 86400000).toISOString();
  await login(page, "/play/assignment1");
  await expect(
    page.getByRole("button", { name: "开始本场冒险" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("status").filter({ hasText: "静候启程" }),
  ).toBeVisible();
});

test("nickname-only profile saves use JSON and preserve a tabbed draft", async ({
  page,
}) => {
  const { player } = await mockQuestionsApi(page);
  await page.route("**/api/questions/v1/me/profile", async (route) => {
    player.displayName = "追星旅人";
    await fulfillJson(route, player);
  });
  await login(page, "/profile");
  const name = page.getByLabel("显示昵称", { exact: true });
  await name.fill("追星旅人");
  if (await page.getByRole("tab", { name: "账号安全" }).isVisible()) {
    await page.getByRole("tab", { name: "账号安全" }).click();
    await page.getByRole("tab", { name: "我的名片" }).click();
  } else {
    await expect(page.getByLabel("当前密码", { exact: true })).toBeInViewport();
  }
  await expect(name).toHaveValue("追星旅人");
  const requestPending = page.waitForRequest("**/api/questions/v1/me/profile");
  await page.getByRole("button", { name: "保存资料" }).click();
  const request = await requestPending;
  expect(request.method()).toBe("PATCH");
  expect(request.headers()["content-type"]).toContain("application/json");
  expect(request.postDataJSON()).toEqual({ displayName: "追星旅人" });
  await expect(page.getByRole("status")).toContainText("资料已保存");
  await expect(page.locator(".player-passport h2")).toHaveText("追星旅人");
});

test("avatar crops before uploading compressed multipart data", async ({
  page,
  browserName,
}) => {
  const { player } = await mockQuestionsApi(page);
  const avatar = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=",
    "base64",
  );
  await page.route("**/api/questions/v1/me/profile", async (route) => {
    player.displayName = "追星旅人";
    player.avatar = "avatar_saved.png";
    await fulfillJson(route, player);
  });
  await page.route("**/api/files/token", (route) =>
    fulfillJson(route, { token: "avatar-test-token" }),
  );
  await page.route("**/api/files/game_players/**", (route) =>
    route.fulfill({ contentType: "image/png", body: avatar }),
  );
  await login(page, "/profile");
  await page.getByLabel("显示昵称", { exact: true }).fill("追星旅人");
  const photo = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2400;
    canvas.height = 1200;
    const context = canvas.getContext("2d")!;
    const pixels = context.createImageData(canvas.width, canvas.height);
    let seed = 42;
    for (let i = 0; i < pixels.data.length; i += 4) {
      for (let channel = 0; channel < 3; channel++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
        pixels.data[i + channel] = seed >>> 24;
      }
      pixels.data[i + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const original = Buffer.from(photo, "base64");
  expect(original.length).toBeGreaterThan(2 * 1024 * 1024);
  const upload = page.getByLabel("上传头像");
  await upload.setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: original,
  });
  await expect(page.getByRole("dialog", { name: "裁剪头像" })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用此头像" })).toBeEnabled();
  await page.getByLabel("缩放", { exact: true }).fill("1.5");
  await page.getByRole("button", { name: "使用此头像" }).click();
  const preview = page.locator(".profile-editor__avatar img");
  await expect(preview).toHaveAttribute("src", /^blob:/);
  if (await page.getByRole("tab", { name: "账号安全" }).isVisible()) {
    await page.getByRole("tab", { name: "账号安全" }).click();
    await page.getByRole("tab", { name: "我的名片" }).click();
    await expect(preview).toHaveAttribute("src", /^blob:/);
  }
  const cropped = await preview.evaluate(async (img: HTMLImageElement) => {
    const blob = await (await fetch(img.src)).blob();
    const bitmap = await createImageBitmap(blob);
    const result = {
      size: blob.size,
      width: bitmap.width,
      height: bitmap.height,
      type: blob.type,
    };
    bitmap.close();
    return result;
  });
  expect(cropped.type).toBe("image/jpeg");
  expect(cropped.width).toBe(cropped.height);
  expect(cropped.width).toBeLessThanOrEqual(512);
  expect(cropped.size).toBeLessThanOrEqual(200 * 1024);

  const requestPending = page.waitForRequest("**/api/questions/v1/me/profile");
  await page.getByRole("button", { name: "保存资料" }).click();
  const request = await requestPending;
  expect(request.method()).toBe("PATCH");
  const contentType = request.headers()["content-type"];
  expect(contentType).toMatch(/^multipart\/form-data;\s*boundary=.+/);
  const body = request.postDataBuffer();
  const form = await new Response(body ? new Uint8Array(body) : null, {
    headers: { "Content-Type": contentType },
  }).formData();
  expect(Array.from(form.keys()).sort()).toEqual(["avatar", "displayName"]);
  expect(form.get("displayName")).toBe("追星旅人");
  const file = form.get("avatar") as File;
  expect(file.name).toBe("avatar.jpg");
  expect(file.type).toBe("image/jpeg");
  // WebKit's intercepted body exposes multipart metadata but omits file bytes.
  // Check the cropped preview above on every engine, and wire bytes in Chromium.
  if (browserName !== "webkit") {
    expect(file.size).toBe(cropped.size);
    expect(Buffer.from(await file.arrayBuffer())).not.toEqual(avatar);
  }
  await expect(page.getByRole("status")).toContainText("资料已保存");
  await expect(page.locator(".player-passport h2")).toHaveText("追星旅人");
  await expect(preview).toHaveAttribute("src", /\/avatar_saved\.png\?/);
  await expect(upload).toHaveValue("");
  await expect(page.locator(".profile-editor__filename")).toHaveCount(0);
});

test("invalid avatar and mismatched passwords never call write endpoints", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  let writes = 0;
  page.on("request", (request) => {
    if (/\/me\/(profile|change-password)$/.test(request.url())) writes++;
  });
  await login(page, "/profile");
  await page.getByLabel("上传头像").evaluate((input: HTMLInputElement) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([new Uint8Array(50 * 1024 * 1024 + 1)], "large.png", {
        type: "image/png",
      }),
    );
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.getByRole("alert")).toContainText("50 MB");
  if (await page.getByRole("tab", { name: "账号安全" }).isVisible()) {
    await page.getByRole("tab", { name: "账号安全" }).click();
  }
  await page
    .getByLabel("当前密码", { exact: true })
    .fill("current-test-password");
  await page.getByLabel("新密码", { exact: true }).fill("new-test-password");
  await page
    .getByLabel("确认新密码", { exact: true })
    .fill("different-test-password");
  await page.getByRole("button", { name: "保存新密码" }).click();
  await expect(page.locator("#password-validation")).toContainText(
    "两次新密码不一致",
  );
  expect(writes).toBe(0);
});

test("failed profile saves keep the typed name available for retry", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await page.route("**/api/questions/v1/me/profile", (route) =>
    fulfillJson(
      route,
      { error: { code: "UNAVAILABLE", message: "保存暂时失败，请重试" } },
      503,
    ),
  );
  await login(page, "/profile");
  await page.getByLabel("显示昵称", { exact: true }).fill("等待保存的旅人");
  await page.getByRole("button", { name: "保存资料" }).click();
  await expect(page.getByRole("alert")).toContainText("保存暂时失败");
  await expect(page.getByLabel("显示昵称", { exact: true })).toHaveValue(
    "等待保存的旅人",
  );
  await expect(page.getByRole("button", { name: "保存资料" })).toBeEnabled();
});

test("rewards show claim details only while available", async ({ page }) => {
  await mockQuestionsApi(page);
  const rewards = makeRewards();
  rewards[1].claimDetails = "PRIVATE-EXPIRED-CLAIM";
  await page.route("**/api/questions/v1/rewards", (route) =>
    fulfillJson(route, { items: rewards }),
  );
  await login(page, "/rewards");
  await expect(page.getByRole("heading", { name: "星辰纪念章" })).toBeVisible();
  await expect(page.getByText("你的领取线索")).toBeVisible();
  await expect(page.getByText("PRIVATE-EXPIRED-CLAIM")).toHaveCount(0);
});

test("a letter can be acknowledged without losing its contents", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  const notes = makeNotifications();
  await page.route("**/api/questions/v1/notifications", (route) =>
    fulfillJson(route, { items: notes }),
  );
  await page.route(
    "**/api/questions/v1/notifications/preview-note/read",
    (route) => {
      notes[0].readAt = new Date().toISOString();
      return fulfillJson(route, {});
    },
  );
  await login(page, "/notifications");
  const letter = page
    .locator(".notification-letter")
    .filter({ hasText: "新的线索已送达" });
  await letter.locator(".mailbox-row__open").click();
  await page.getByRole("button", { name: "收到消息", exact: true }).click();
  await expect(letter).toHaveAttribute("data-read", "true");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await letter.locator(".mailbox-row__open").click();
  await expect(page.locator(".notification-content")).toContainText(
    "请到入口领取下一份线索",
  );
  await expect(
    page.getByRole("button", { name: "关闭信件", exact: true }),
  ).toBeVisible();
});

test("narrow layouts and long content never overflow; bottom navigation stays reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const { assignment, player } = await mockQuestionsApi(page);
  player.displayName = "星图尽头仍然在寻找答案的远航者";
  assignment.title = "这是一场名字很长但仍然需要完整展示的星辰探险";
  await login(page);
  for (const label of ["启程", "收藏", "来信", "护照"]) {
    const nav = page.getByRole("navigation", { name: "冒险导航" });
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(
      nav.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(nav).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await expect(page.getByRole("button", { name: "保存资料" })).toBeVisible();
});

test("reduced motion leaves the lobby readable without running atlas animations", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await expect(
    page.getByRole("heading", { name: "下一段故事，等你落笔。" }),
  ).toBeVisible();
  await expect(
    page.locator(".celestial-atlas__orbit--outer").first(),
  ).toHaveCSS("animation-name", "none");
  await expect(page.locator(".chapter-card").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});
