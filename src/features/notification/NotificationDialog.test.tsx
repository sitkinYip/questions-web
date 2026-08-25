import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotificationDialog } from "./NotificationDialog";

describe("NotificationDialog", () => {
  it("renders legacy rich content safely and delegates media previews", () => {
    const onClose = vi.fn();
    const onOpenImages = vi.fn();
    render(
      <NotificationDialog
        userId="alice"
        notification={{
          id: "notice-1",
          title: "测试讯息",
          popupTitle: "魔法通知",
          buttonText: "知晓了",
          content: "[[重点]] {{https://img.example/a.jpg}} <<javascript:bad>>",
          createdAt: "2026-08-25",
          revision: "r1",
        }}
        queuedCount={2}
        onClose={onClose}
        onOpenImages={onOpenImages}
        onOpenVideo={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "魔法通知" });
    expect(within(dialog).getByText("重点")).toBeInTheDocument();
    expect(within(dialog).getByText("还有 1 条讯息")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /播放/ })).toBeNull();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "查看通知图片" }),
    );
    expect(onOpenImages).toHaveBeenCalledWith(["https://img.example/a.jpg"]);
    fireEvent.click(within(dialog).getByRole("button", { name: "知晓了" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
