import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchNotifications } from "@/api/client";
import { adaptNotificationRecord } from "@/api/notification.adapter";
import { notificationRecordSchema } from "@/api/notification.schema";

describe("PocketBase notification contract", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes optional presentation fields", () => {
    const record = notificationRecordSchema.parse({
      id: "notice-1",
      title: "远方来信",
      content: "[[重要内容]]",
      popupTitle: null,
      buttonText: "  收到  ",
      enabled: true,
      user: "alice",
      created: "2026-08-25 10:00:00.000Z",
      updated: "2026-08-25 10:01:00.000Z",
    });

    const notification = adaptNotificationRecord(record);
    expect(notification).toMatchObject({
      id: "notice-1",
      buttonText: "收到",
      userId: "alice",
    });
    expect(notification).not.toHaveProperty("popupTitle");
  });

  it("filters by enabled user on the server and defends again locally", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "mine",
              title: "我的通知",
              content: "hello",
              enabled: true,
              user: "o'hara",
              created: "2026-08-25",
              updated: "2026-08-25",
            },
            {
              id: "other",
              title: "其他用户通知",
              content: "hidden",
              enabled: true,
              user: "other",
              created: "2026-08-25",
              updated: "2026-08-25",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchNotifications("o'hara");
    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);

    expect(requestedUrl.searchParams.get("filter")).toBe(
      "(enabled=true)&&(user='o\\'hara')",
    );
    expect(result.map((item) => item.id)).toEqual(["mine"]);
  });
});
