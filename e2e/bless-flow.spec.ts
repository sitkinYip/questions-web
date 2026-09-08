import { expect, test } from "@playwright/test";
import {
  login,
  mockLegacyAudioPlayback,
  mockQuestionsApi,
} from "@e2e/fixtures";

test("authorized Bless content plays and returns to its assignment", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockQuestionsApi(page, { completed: true });
  await mockLegacyAudioPlayback(page);
  await login(page, "/play/assignment1/content/bless1");
  await expect(page.getByRole("link", { name: "返回冒险" })).toHaveAttribute(
    "href",
    "/play/assignment1",
  );
  await page.getByRole("button", { name: "点击开启你的专属星空" }).click();
  await expect(page.getByRole("region", { name: "星空谢幕" })).toBeVisible({
    timeout: 5000,
  });
  await page.getByRole("link", { name: "返回冒险" }).click();
  await expect(page).toHaveURL(/\/play\/assignment1$/);
  expect(errors).toEqual([]);
});

test("direct narrative links cannot bypass the server unlock check", async ({
  page,
}) => {
  await mockQuestionsApi(page);
  await login(page, "/play/assignment1/content/bless1");
  await expect(page.getByRole("alert")).toContainText("内容尚未解锁", {
    timeout: 15000,
  });
  await expect(
    page.getByRole("button", { name: "点击开启你的专属星空" }),
  ).toHaveCount(0);
});
