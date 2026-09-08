import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchNotifications } from "@/api/client";
import { NOTIFICATION_SEEN_IDS_KEY } from "@/infrastructure/storage/notification.repository";
import { useNotifications } from "@/features/notification/useNotifications";

vi.mock("@/api/client", () => ({
  fetchNotifications: vi.fn(),
}));

const notifications = [
  {
    id: "notice-newer",
    title: "较新的消息",
    content: "消息内容",
    createdAt: "2026-08-27T10:00:00.000Z",
    revision: "r2",
  },
  {
    id: "notice-older",
    title: "较早的消息",
    content: "消息内容",
    createdAt: "2026-08-26T10:00:00.000Z",
    revision: "r1",
  },
];

describe("useNotifications", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    vi.mocked(fetchNotifications).mockResolvedValue(notifications);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("counts unread messages and marks the displayed message read on dismiss", async () => {
    const { result } = renderHook(() => useNotifications("alice", 0));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.unreadCount).toBe(2);
    expect(result.current.current?.id).toBe("notice-older");
    expect(window.localStorage.getItem(NOTIFICATION_SEEN_IDS_KEY)).toBeNull();

    act(() => result.current.dismissCurrent());

    expect(result.current.unreadCount).toBe(1);
    expect(
      JSON.parse(
        window.localStorage.getItem(NOTIFICATION_SEEN_IDS_KEY) ?? "[]",
      ),
    ).toEqual(["notice-older"]);
  });

  it("does not include previously read messages in the unread count", async () => {
    window.localStorage.setItem(
      NOTIFICATION_SEEN_IDS_KEY,
      JSON.stringify(["notice-older"]),
    );
    const { result } = renderHook(() => useNotifications("alice", 0));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.unreadCount).toBe(1);
    expect(result.current.current?.id).toBe("notice-newer");
  });
});
