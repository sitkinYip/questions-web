import { expect, test } from "@playwright/test";
import { levels, pocketBaseList } from "./fixtures";

test("shows a non-retryable contract error", async ({ page }) => {
  await page.route("**/api/collections/levels/records?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"items":"broken"}',
    }),
  );
  await page.goto("/?qa=11");
  await expect(
    page.getByRole("heading", { name: "数据格式发生变化" }),
  ).toBeVisible();
  await expect(page.locator("[data-error-kind=contract]")).toBeVisible();
  await expect(page.getByRole("button", { name: "重新尝试" })).toHaveCount(0);
});

test("recovers from a server failure through retry", async ({ page }) => {
  let recovered = false;
  await page.route("**/api/collections/levels/records?*", (route) =>
    recovered
      ? route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(pocketBaseList(levels)),
        })
      : route.fulfill({
          status: 503,
          contentType: "application/json",
          body: "{}",
        }),
  );
  await page.goto("/?qa=11");
  await expect(
    page.getByRole("heading", { name: "数据服务暂时不可用" }),
  ).toBeVisible({
    timeout: 10_000,
  });
  recovered = true;
  await page.getByRole("button", { name: "重新尝试" }).click();
  await expect(page.getByRole("heading", { name: "星辰之门" })).toBeVisible();
});
