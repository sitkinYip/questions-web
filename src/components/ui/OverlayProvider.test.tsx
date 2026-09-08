import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { AppDialog } from "@/components/ui/Dialog";
import { overlayPriority } from "@/components/ui/overlay-context";
import { OverlayProvider } from "@/components/ui/OverlayProvider";

function OverlayHarness() {
  const [notificationOpen, setNotificationOpen] = useState(true);
  const [completionOpen, setCompletionOpen] = useState(true);

  return (
    <OverlayProvider>
      <AppDialog
        overlayId="test-notification"
        priority={overlayPriority.notification}
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
        accessibleTitle="通知"
        overlayClassName="notification-backdrop"
        contentClassName="notification-dialog"
      >
        <button type="button" onClick={() => setNotificationOpen(false)}>
          关闭通知
        </button>
      </AppDialog>
      <AppDialog
        overlayId="test-completion"
        priority={overlayPriority.completion}
        open={completionOpen}
        onOpenChange={setCompletionOpen}
        accessibleTitle="通关"
        overlayClassName="completion-backdrop"
        contentClassName="completion-dialog"
      >
        <button type="button" onClick={() => setCompletionOpen(false)}>
          关闭通关
        </button>
      </AppDialog>
    </OverlayProvider>
  );
}

describe("OverlayProvider", () => {
  it("只显示优先级最高的弹窗，并在关闭后恢复排队弹窗", async () => {
    render(<OverlayHarness />);

    expect(
      await screen.findByRole("dialog", { name: "通关" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "通知" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭通关" }));

    expect(
      await screen.findByRole("dialog", { name: "通知" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "通关" }),
    ).not.toBeInTheDocument();
  });
});
