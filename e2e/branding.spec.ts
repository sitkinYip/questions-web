import { expect, test } from "@playwright/test";
import { mockStarwardApi } from "@e2e/fixtures";

test("Starward presents a transparent page mark and its approved app icons", async ({
  page,
}) => {
  await mockStarwardApi(page);
  await page.goto("/login");
  await expect(page).toHaveTitle("赴星之约");
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute(
    "content",
    "赴星之约",
  );
  await expect(
    page.locator('meta[name="apple-mobile-web-app-title"]'),
  ).toHaveAttribute("content", "赴星之约");
  await expect(
    page.getByRole("link", { name: "赴星之约 · 回到启程" }),
  ).toContainText("赴星之约");

  const mark = page.locator(".game-brand .brand-mark");
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute("alt", "");
  await expect(mark).toHaveAttribute(
    "src",
    /\/branding\/starward-mark-96\.png$/,
  );
  await expect
    .poll(() =>
      mark.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    )
    .toBe(true);
  const transparency = await mark.evaluate((image: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to inspect the loaded brand mark");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    return {
      corners: [
        pixels[3],
        pixels[(canvas.width - 1) * 4 + 3],
        pixels[(canvas.height - 1) * canvas.width * 4 + 3],
        pixels[pixels.length - 1],
      ],
      hasVisibleMark: pixels.some(
        (value, index) => index % 4 === 3 && value > 0,
      ),
    };
  });
  expect(transparency).toEqual({
    corners: [0, 0, 0, 0],
    hasVisibleMark: true,
  });

  for (const selector of [
    'link[rel="icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="manifest"]',
  ]) {
    const urls = await page
      .locator(selector)
      .evaluateAll((links) =>
        links.map((link) => (link as HTMLLinkElement).href),
      );
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      const response = await page.request.get(url);
      expect(response.ok()).toBe(true);
      if (selector === 'link[rel="manifest"]') {
        const manifest = await response.json();
        expect(manifest.name).toBe("赴星之约");
        expect(manifest.start_url).toBe("./");
        expect(
          manifest.icons.map((icon: { sizes: string }) => icon.sizes),
        ).toEqual(["192x192", "512x512"]);
        for (const icon of manifest.icons)
          expect(icon.src).toMatch(/^branding\/starward-icon-\d+\.png$/);
      } else {
        expect(new URL(url).pathname).toMatch(
          /\/branding\/starward-icon-\d+\.png$/,
        );
        expect(response.headers()["content-type"]).toContain("image/png");
      }
    }
  }

  for (const theme of ["dark", "light"]) {
    await page.goto(`/login?theme=${theme}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    for (const viewport of [
      { name: "desktop", width: 1366, height: 900 },
      { name: "mobile", width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(mark).toBeInViewport();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: test.info().outputPath(`starward-${theme}-${viewport.name}.png`),
        animations: "disabled",
      });
    }
  }
});

test("the Starward rename preserves a legacy login and theme without restoring them after logout", async ({
  page,
}) => {
  await mockStarwardApi(page);
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.removeItem("starward:v2:auth");
    localStorage.removeItem("starward:v1:theme");
    localStorage.setItem(
      "questions:v2:auth",
      JSON.stringify({ token: "ui-test-token", playerId: "playeralice" }),
    );
    localStorage.setItem(
      "questions:v1:theme",
      JSON.stringify({ version: 1, preference: "dark" }),
    );
  });
  await page.goto("/profile");
  await expect(page.getByLabel("显示昵称", { exact: true })).toHaveValue(
    "远航者",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(() => ({
      auth: JSON.parse(localStorage.getItem("starward:v2:auth") || "null"),
      theme: JSON.parse(localStorage.getItem("starward:v1:theme") || "null"),
      oldAuth: localStorage.getItem("questions:v2:auth"),
      oldTheme: localStorage.getItem("questions:v1:theme"),
    })),
  ).toEqual({
    auth: { token: "ui-test-token", playerId: "playeralice" },
    theme: { version: 1, preference: "dark" },
    oldAuth: null,
    oldTheme: null,
  });
  await page.getByRole("button", { name: "打开冒险者菜单" }).click();
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page.getByLabel("登录账号", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("登录账号", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => [
      localStorage.getItem("starward:v2:auth"),
      localStorage.getItem("questions:v2:auth"),
    ]),
  ).toEqual([null, null]);
});
