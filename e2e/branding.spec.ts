import { expect, test, type Page } from "@playwright/test";
import { mockStarwardApi } from "@e2e/fixtures";

async function inspectAppIcon(page: Page, url: string, maskable = false) {
  return page.evaluate(
    async ({ url, maskable }) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      const { naturalWidth: width, naturalHeight: height } = image;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to inspect the app icon");
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, width, height).data;
      let opaque = true;
      const blue = new Uint8Array(width * height);
      for (let index = 0; index < blue.length; index++) {
        const offset = index * 4;
        if (pixels[offset + 3] !== 255) opaque = false;
        if (
          maskable &&
          pixels[offset + 2] >= 160 &&
          pixels[offset + 1] >= 100 &&
          pixels[offset + 2] - pixels[offset] >= 15
        )
          blue[index] = 1;
      }
      let logoPixels = 0;
      let logoRadius = 0;
      for (let index = 0; index < blue.length; index++) {
        if (!blue[index]) continue;
        const component = [index];
        blue[index] = 0;
        for (let cursor = 0; cursor < component.length; cursor++) {
          const pixel = component[cursor];
          const x = pixel % width;
          const y = Math.floor(pixel / width);
          for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]) {
            const nextX = x + dx;
            const nextY = y + dy;
            const next = nextY * width + nextX;
            if (
              nextX >= 0 &&
              nextX < width &&
              nextY >= 0 &&
              nextY < height &&
              blue[next]
            ) {
              blue[next] = 0;
              component.push(next);
            }
          }
        }
        // Small isolated stars are decorative; the connected blue forms carry the logo.
        if (component.length < 64) continue;
        logoPixels += component.length;
        for (const pixel of component)
          logoRadius = Math.max(
            logoRadius,
            Math.hypot(
              (pixel % width) + 0.5 - width / 2,
              Math.floor(pixel / width) + 0.5 - height / 2,
            ),
          );
      }
      return {
        width,
        height,
        opaque,
        logoPixels,
        logoRadius: logoRadius / width,
      };
    },
    { url, maskable },
  );
}

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
  for (const [name, value] of Object.entries({
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  }))
    await expect(page.locator(`meta[name="${name}"]`)).toHaveAttribute(
      "content",
      value,
    );
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
        const appUrl = new URL("./", url);
        expect(manifest.name).toBe("赴星之约");
        expect(manifest.short_name).toBe("赴星之约");
        expect(manifest.display).toBe("standalone");
        for (const key of ["id", "start_url", "scope"]) {
          expect(manifest[key]).toBe("./");
          expect(new URL(manifest[key], url).href).toBe(appUrl.href);
        }
        expect(new URL(page.url()).pathname).toBe(`${appUrl.pathname}login`);
        const anySources = [];
        let maskableSource = "";
        for (const [edge, purpose] of [
          [192, "any"],
          [512, "any"],
          [512, "maskable"],
        ] as const) {
          const icon = manifest.icons.find(
            (candidate: { sizes: string; purpose: string }) =>
              candidate.sizes === `${edge}x${edge}` &&
              candidate.purpose === purpose,
          );
          expect(icon, `${edge}px ${purpose} icon`).toBeDefined();
          expect(icon.type).toBe("image/png");
          expect(icon.src).toMatch(
            purpose === "maskable"
              ? /^branding\/starward-icon-maskable-\d+\.png$/
              : /^branding\/starward-icon-\d+\.png$/,
          );
          expect(icon.src).not.toMatch(/^(?:\/|[a-z][a-z\d+.-]*:)/i);
          const iconUrl = new URL(icon.src, url);
          expect(iconUrl.origin).toBe(appUrl.origin);
          expect(iconUrl.pathname.startsWith(appUrl.pathname)).toBe(true);
          const iconResponse = await page.request.get(iconUrl.href);
          expect(iconResponse.ok()).toBe(true);
          expect(iconResponse.headers()["content-type"]).toContain("image/png");
          const pixels = await inspectAppIcon(
            page,
            iconUrl.href,
            purpose === "maskable",
          );
          expect(pixels).toMatchObject({
            width: edge,
            height: edge,
            opaque: true,
          });
          if (purpose === "maskable") {
            maskableSource = iconUrl.href;
            expect(pixels.logoPixels).toBeGreaterThan(edge * edge * 0.01);
            expect(pixels.logoRadius).toBeLessThanOrEqual(0.4);
          } else anySources.push(iconUrl.href);
        }
        expect(anySources).not.toContain(maskableSource);
      } else {
        expect(new URL(url).pathname).toMatch(
          /\/branding\/starward-icon-\d+\.png$/,
        );
        expect(response.headers()["content-type"]).toContain("image/png");
        const pixels = await inspectAppIcon(page, url);
        expect(pixels.opaque).toBe(true);
        if (selector === 'link[rel="apple-touch-icon"]')
          expect(pixels).toMatchObject({ width: 180, height: 180 });
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
