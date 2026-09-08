import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/FormControls";
import { Sheet } from "@/components/ui/Sheet";
import { AppToast } from "@/components/ui/Toast";
import { ToastProvider } from "@/components/ui/ToastProvider";

describe("UI primitives", () => {
  it("provides safe button defaults and explicit variants", () => {
    const onClick = vi.fn();
    render(
      <Button variant="danger" onClick={onClick}>
        删除
      </Button>,
    );

    const button = screen.getByRole("button", { name: "删除" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("ui-button--danger");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps field labels associated with input and select controls", () => {
    render(
      <>
        <Field label="旅行者名称">
          <Input defaultValue="Sitkin" />
        </Field>
        <Field label="记录类型">
          <Select defaultValue="all">
            <option value="all">全部</option>
          </Select>
        </Field>
      </>,
    );

    expect(screen.getByLabelText("旅行者名称")).toHaveValue("Sitkin");
    expect(screen.getByLabelText("记录类型")).toHaveValue("all");
  });

  it("exposes a controlled, accessible sheet interface", async () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <Sheet
          overlayId="test-sheet"
          open={open}
          onOpenChange={setOpen}
          title="冒险档案"
          description="查看当前旅程资料"
        >
          档案内容
        </Sheet>
      );
    }

    render(<Harness />);
    expect(
      screen.getByRole("dialog", { name: "冒险档案" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭冒险档案" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "冒险档案" })).toBeNull(),
    );
  });

  it("supports controlled toast actions and dismissal", () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ToastProvider>
        <AppToast
          open
          onOpenChange={onOpenChange}
          title="背景音乐提示"
          actionLabel="开启"
          onAction={onAction}
        />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "开启" }));
    expect(onAction).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "关闭背景音乐提示" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
