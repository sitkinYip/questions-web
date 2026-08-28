import { expect, test } from "@playwright/test";
import { fulfillJson, login, mockQuestionsApi } from "./fixtures";

test("reports a mismatched server contract without rendering private content", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await page.route("**/api/questions/v1/me", (route) =>
    fulfillJson(route, { id: "broken" }),
  );
  await login(page);
  await expect(page.getByRole("alert")).toContainText("服务端数据版本不匹配");
  await expect(page.getByRole("heading", { name: "我的场次" })).toHaveCount(0);
});

test("recovers from a server error without discarding the login", async ({
  page,
}) => {
  const state = await mockQuestionsApi(page);
  let recovered = false;
  await page.route("**/api/questions/v1/assignments", (route) =>
    recovered
      ? fulfillJson(route, { items: [state.assignment] })
      : fulfillJson(
          route,
          { error: { code: "UNAVAILABLE", message: "服务暂时不可用" } },
          503,
        ),
  );
  await login(page);
  await expect(page.getByRole("alert")).toContainText("服务暂时不可用", {
    timeout: 15000,
  });
  recovered = true;
  await page.getByRole("button", { name: "重新尝试" }).click();
  await expect(page.getByRole("heading", { name: "星辰探险" })).toBeVisible();
});
