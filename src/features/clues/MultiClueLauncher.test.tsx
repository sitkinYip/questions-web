import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MULTI_CLUE_LAUNCHER_POSITION_KEY } from "../../infrastructure/storage/multi-clue-launcher.repository";
import { MultiClueLauncher } from "./MultiClueLauncher";

describe("MultiClueLauncher", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts away from the bottom-corner controls and opens the archive", () => {
    const onOpen = vi.fn();
    render(<MultiClueLauncher onOpen={onOpen} />);
    const launcher = screen.getByRole("button", { name: "查看本场线索" });

    expect(launcher).toHaveAttribute("data-horizontal", "right");
    expect(Number.parseFloat(launcher.style.top)).toBeLessThan(
      window.innerHeight - 64 - 12,
    );
    fireEvent.click(launcher);
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("snaps after dragging, persists the position and suppresses the drag click", () => {
    const onOpen = vi.fn();
    render(<MultiClueLauncher onOpen={onOpen} />);
    const launcher = screen.getByRole("button", { name: "查看本场线索" });

    fireEvent.pointerDown(launcher, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 900,
      clientY: 560,
    });
    fireEvent.pointerMove(launcher, {
      pointerId: 1,
      clientX: 120,
      clientY: 330,
    });
    fireEvent.pointerUp(launcher, {
      pointerId: 1,
      clientX: 120,
      clientY: 330,
    });
    fireEvent.click(launcher);

    expect(onOpen).not.toHaveBeenCalled();
    expect(launcher).toHaveAttribute("data-horizontal", "left");
    expect(
      JSON.parse(
        window.localStorage.getItem(MULTI_CLUE_LAUNCHER_POSITION_KEY) ?? "null",
      ),
    ).toEqual({ x: 0, y: expect.any(Number) });

    fireEvent.click(launcher);
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("supports keyboard positioning and persists the new location", () => {
    render(<MultiClueLauncher onOpen={vi.fn()} />);
    const launcher = screen.getByRole("button", { name: "查看本场线索" });

    fireEvent.keyDown(launcher, { key: "ArrowUp", altKey: true });

    expect(
      JSON.parse(
        window.localStorage.getItem(MULTI_CLUE_LAUNCHER_POSITION_KEY) ?? "null",
      ).y,
    ).toBeLessThan(0.72);
  });
});
