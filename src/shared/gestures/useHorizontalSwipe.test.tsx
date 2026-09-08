import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useHorizontalSwipe } from "@/shared/gestures/useHorizontalSwipe";

function SwipeSurface({ left = vi.fn(), right = vi.fn() }) {
  const handlers = useHorizontalSwipe({
    onSwipeLeft: left,
    onSwipeRight: right,
  });
  return (
    <article data-testid="surface" {...handlers}>
      <span>可滑动区域</span>
      <button type="button">交互控件</button>
    </article>
  );
}

describe("useHorizontalSwipe", () => {
  it("recognizes horizontal swipes in both directions", () => {
    const left = vi.fn();
    const right = vi.fn();
    render(<SwipeSurface left={left} right={right} />);
    const surface = screen.getByTestId("surface");

    fireEvent.pointerDown(surface, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 180,
      clientY: 80,
    });
    fireEvent.pointerUp(surface, {
      pointerId: 1,
      clientX: 80,
      clientY: 86,
    });
    fireEvent.pointerDown(surface, {
      pointerId: 2,
      isPrimary: true,
      button: 0,
      clientX: 70,
      clientY: 80,
    });
    fireEvent.pointerUp(surface, {
      pointerId: 2,
      clientX: 150,
      clientY: 84,
    });

    expect(left).toHaveBeenCalledOnce();
    expect(right).toHaveBeenCalledOnce();
  });

  it("does not hijack controls or vertical scrolling", () => {
    const left = vi.fn();
    render(<SwipeSurface left={left} />);
    const surface = screen.getByTestId("surface");
    const button = screen.getByRole("button", { name: "交互控件" });

    fireEvent.pointerDown(button, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 180,
      clientY: 80,
    });
    fireEvent.pointerUp(surface, {
      pointerId: 1,
      clientX: 80,
      clientY: 86,
    });
    fireEvent.pointerDown(surface, {
      pointerId: 2,
      isPrimary: true,
      button: 0,
      clientX: 180,
      clientY: 40,
    });
    fireEvent.pointerUp(surface, {
      pointerId: 2,
      clientX: 100,
      clientY: 170,
    });

    expect(left).not.toHaveBeenCalled();
  });
});
