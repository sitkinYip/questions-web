import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOTIFICATION_LAUNCHER_POSITION_KEY } from "../../infrastructure/storage/notification.repository";
import { NotificationCenter } from "./NotificationCenter";

vi.mock("./useNotifications", () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: "notice-1",
        title: "测试讯息",
        content: "来自远方的消息",
        createdAt: "2026-08-25",
        revision: "r1",
      },
    ],
    current: null,
    queuedCount: 0,
    dismissCurrent: vi.fn(),
  }),
}));

describe("NotificationCenter launcher", () => {
  beforeEach(() => window.localStorage.clear());

  it("snaps after dragging, persists its position and does not toggle the list", () => {
    const { container } = render(
      <NotificationCenter
        userId="alice"
        blocked={false}
        onOpenImages={vi.fn()}
        onOpenVideo={vi.fn()}
      />,
    );
    const launcher = container.querySelector(".notification-launcher");
    const bell = screen.getByRole("button", { name: "打开通知列表" });

    fireEvent.pointerDown(bell, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 30,
      clientY: 700,
    });
    fireEvent.pointerMove(bell, {
      pointerId: 1,
      clientX: 900,
      clientY: 240,
    });
    fireEvent.pointerUp(bell, {
      pointerId: 1,
      clientX: 900,
      clientY: 240,
    });
    fireEvent.click(bell);

    expect(bell).toHaveAttribute("aria-expanded", "false");
    expect(launcher).toHaveAttribute("data-horizontal", "right");
    expect(
      JSON.parse(
        window.localStorage.getItem(NOTIFICATION_LAUNCHER_POSITION_KEY) ??
          "null",
      ),
    ).toEqual({ x: 1, y: expect.any(Number) });
  });

  it("still opens normally when the gesture is a tap", () => {
    render(
      <NotificationCenter
        userId="alice"
        blocked={false}
        onOpenImages={vi.fn()}
        onOpenVideo={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开通知列表" }));

    expect(
      screen.getByRole("button", { name: "关闭通知列表" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("通知列表")).toBeInTheDocument();
  });
});
