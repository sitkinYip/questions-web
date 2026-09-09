import { expect, test } from "@playwright/test";
import { editorPreviewHost } from "./editor-preview-host";
import { sessionFixture } from "./session-preview-fixture";

test("session preview walks start, wrong/correct, ordered clues, auto-next and finale into a local narrative", async ({
  page,
}) => {
  const { frame, send, requests, errors, verify } = await editorPreviewHost(
    page,
    390,
    "session",
  );
  await frame
    .locator("body")
    .evaluate(() =>
      history.replaceState(
        null,
        "",
        `/questions-next/preview/${location.search}`,
      ),
    );
  await send({ kind: "session", value: sessionFixture() });
  await frame.getByRole("button", { name: "开始本场冒险" }).click();
  await expect(frame.getByRole("dialog")).toContainText("开场线索 正文");
  await frame.getByRole("dialog").getByRole("button").click();
  await frame.getByRole("button", { name: "模拟答错" }).click();
  await expect(frame.locator(".quest-card")).toHaveAttribute(
    "data-answer-state",
    "incorrect",
  );
  await frame.getByRole("button", { name: "模拟答对" }).click();
  await expect(frame.getByRole("dialog")).toContainText("过关线索 正文");
  await frame.getByRole("dialog").getByRole("button").click();
  await expect(frame.getByRole("dialog")).toContainText("通用线索 正文");
  await frame.getByRole("dialog").getByRole("button").click();
  await expect(frame.getByRole("combobox", { name: "当前关卡" })).toHaveValue(
    "l2",
  );
  await expect(
    frame.getByRole("heading", { name: "题目2", exact: true }),
  ).toBeVisible();
  await frame
    .getByRole("combobox", { name: "手动解锁线索" })
    .selectOption("手动线索");
  await expect(frame.getByRole("dialog")).toContainText("手动线索 正文");
  await frame.getByRole("dialog").getByRole("button").click();
  await frame.getByRole("button", { name: "模拟答对" }).click();
  await frame.getByRole("button", { name: "揭示最终线索" }).click();
  await expect(frame.getByRole("dialog")).toContainText("终局线索 正文");
  await frame.getByRole("dialog").getByRole("button").click();
  await frame.getByRole("link", { name: "继续旅程", exact: true }).click();
  await frame.getByRole("button", { name: "开启来信" }).click();
  await frame.getByRole("button", { name: "显示全文" }).click();
  await expect(frame.locator(".letter-paper-current")).toContainText(
    "通关剧情正文。",
  );
  await frame.getByRole("button", { name: "返回场次预览" }).click();
  await expect(frame.getByRole("combobox", { name: "预览阶段" })).toHaveValue(
    "completed",
  );
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await verify();
});
for (const width of [320, 1200])
  test(`session preview preserves bookmark, resets overlays on edits, and handles empty references at ${width}px`, async ({
    page,
  }) => {
    const { frame, send, requests, errors, verify } = await editorPreviewHost(
      page,
      width,
      "session",
    );
    const value = sessionFixture();
    await send({ kind: "session", value });
    await frame.getByRole("combobox", { name: "当前关卡" }).selectOption("l2");
    await expect(
      frame.getByRole("heading", { name: "题目2", exact: true }),
    ).toBeVisible();
    await frame
      .getByRole("combobox", { name: "手动解锁线索" })
      .selectOption("手动线索");
    await expect(frame.getByRole("dialog")).toBeVisible();
    value.assignment.levels.reverse();
    value.assignment.levels[0].question!.title = "编辑后的第二题";
    value.assignment.presentation.hideTitle = true;
    await send({ kind: "session", value }, 1, "dark");
    await expect(frame.getByRole("dialog")).toHaveCount(0);
    await expect(frame.getByRole("combobox", { name: "当前关卡" })).toHaveValue(
      "l2",
    );
    await expect(
      frame.getByRole("heading", { name: "编辑后的第二题", exact: true }),
    ).toHaveCount(0);
    await expect(frame.locator("html")).toHaveAttribute("data-theme", "dark");
    const sizes = await frame.locator("body").evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
    value.assignment.levels = [];
    value.assignment.totalLevels = 0;
    value.issues = ["引用缺失"];
    await send({ kind: "session", value });
    await expect(
      frame.getByText("添加关卡并选择题目后，即可预览场次流程。"),
    ).toBeVisible();
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
    await verify();
  });

test("session navigation keeps missing narratives and external targets inside preview", async ({
  page,
}) => {
  const { frame, send, verify } = await editorPreviewHost(page, 390, "session");
  const value = sessionFixture();
  value.narratives = [];
  await send({ kind: "session", value });
  await frame
    .getByRole("combobox", { name: "预览阶段" })
    .selectOption("completed");
  await frame.getByRole("link", { name: "预览完成后入口" }).click();
  await expect(frame.getByRole("status")).toContainText("剧情引用不存在");
  value.assignment.completionTarget = {
    kind: "link",
    url: "https://example.com/finish",
  };
  await send({ kind: "session", value });
  await frame.getByRole("link", { name: "预览完成后入口" }).click();
  await expect(frame.getByRole("status")).toContainText(
    "https://example.com/finish",
  );
  await expect(page).toHaveURL(/editor-preview-host/);
  await verify();
});
