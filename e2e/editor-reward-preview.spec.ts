import { expect, test } from "@playwright/test";
import { editorPreviewHost } from "./editor-preview-host";
for (const width of [320, 390, 1200])
  test(`reward preview uses the shared card and updates all states at ${width}px`, async ({
    page,
  }) => {
    const { frame, send, verify } = await editorPreviewHost(
      page,
      width,
      "reward",
    );
    const value = {
      name: "纪念奖品",
      image: "",
      description: "奖品介绍",
      claimMethod: "staff" as const,
      publicInstructions: "请找工作人员领取",
    };
    await send({ kind: "reward", value }, 0, "light", "available");
    await expect(
      frame.getByRole("heading", { name: "纪念奖品", exact: true }),
    ).toBeVisible();
    await expect(frame.locator(".reward-card")).toHaveAttribute(
      "data-state",
      "available",
    );
    value.name = "修改后的奖品";
    value.publicInstructions = "请到服务台领取";
    await send({ kind: "reward", value }, 0, "dark", "redeemed");
    await expect(
      frame.getByRole("heading", { name: "修改后的奖品", exact: true }),
    ).toBeVisible();
    await frame.getByRole("button", { name: "查看修改后的奖品详情" }).click();
    await expect(frame.getByText("请到服务台领取")).toBeVisible();
    await frame.getByRole("button", { name: "关闭修改后的奖品" }).click();
    await expect(frame.locator(".reward-card")).toHaveAttribute(
      "data-state",
      "redeemed",
    );
    await expect(frame.locator("html")).toHaveAttribute("data-theme", "dark");
    await send({ kind: "reward", value }, 1, "light", "voided");
    await expect(frame.locator(".reward-card")).toHaveAttribute(
      "data-state",
      "voided",
    );
    await expect(frame.locator(".game-claim-details")).toHaveCount(0);
    const metrics = await frame.locator("body").evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.width);
    await verify();
  });
