import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { MailboxRow } from "./MailboxRow";

it("reveals an explicit acceptance action on touch swipe without opening or accepting the letter", () => {
  const open = vi.fn(),
    read = vi.fn();
  render(
    <MailboxRow
      title="测试来信"
      summary="摘要"
      meta="今天"
      icon={null}
      unread
      onOpen={open}
      onRead={read}
    />,
  );
  const row = screen.getByRole("button", { name: /测试来信/ });
  // jsdom does not implement PointerEvent's coordinates.
  const dispatch = (type: string, x: number, y: number) => {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, { pointerType: "touch", clientX: x, clientY: y });
    fireEvent(row, event);
  };
  dispatch("pointerdown", 220, 30);
  dispatch("pointermove", 90, 33);
  dispatch("pointerup", 90, 33);
  fireEvent.click(row);
  expect(open).not.toHaveBeenCalled();
  expect(read).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "收下" }));
  expect(read).toHaveBeenCalledOnce();
});

it("does not interpret vertical scrolling as an acceptance gesture", () => {
  const open = vi.fn();
  render(
    <MailboxRow
      title="垂直滚动"
      summary="摘要"
      meta="今天"
      icon={null}
      unread
      onOpen={open}
      onRead={vi.fn()}
    />,
  );
  const row = screen.getByRole("button", { name: /垂直滚动/ });
  for (const [type, x, y] of [
    ["pointerdown", 220, 30],
    ["pointermove", 180, 130],
    ["pointerup", 180, 130],
  ] as const) {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, { pointerType: "touch", clientX: x, clientY: y });
    fireEvent(row, event);
  }
  expect(screen.queryByRole("button", { name: "收下" })).toBeNull();
});
