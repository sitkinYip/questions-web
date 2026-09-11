import { fireEvent, render, screen, act } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { useMotionPresence } from "@/shared/motion/useMotionPresence";

function Harness() {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const present = useMotionPresence(open, ref);
  return (
    <>
      <button onClick={() => setOpen((value) => !value)}>toggle</button>
      {present && (
        <div
          ref={ref}
          data-testid="surface"
          style={{
            animationName: open
              ? "motion-surface-enter"
              : "motion-surface-exit",
            animationDuration: "240ms",
          }}
        >
          <span>child</span>
        </div>
      )}
    </>
  );
}
afterEach(() => vi.useRealTimers());
it("retains exit, ignores descendant animation end, then removes the surface", () => {
  render(<Harness />);
  fireEvent.click(screen.getByText("toggle"));
  fireEvent(
    screen.getByText("child"),
    Object.assign(new Event("animationend", { bubbles: true }), {
      animationName: "motion-surface-exit",
    }),
  );
  expect(screen.getByTestId("surface")).toBeInTheDocument();
  fireEvent(
    screen.getByTestId("surface"),
    Object.assign(new Event("animationend", { bubbles: true }), {
      animationName: "motion-surface-exit",
    }),
  );
  expect(screen.queryByTestId("surface")).toBeNull();
});
it("cancels stale exit deadlines when reopened and falls back if events are missing", () => {
  vi.useFakeTimers();
  render(<Harness />);
  fireEvent.click(screen.getByText("toggle"));
  act(() => vi.advanceTimersByTime(100));
  fireEvent.click(screen.getByText("toggle"));
  act(() => vi.advanceTimersByTime(500));
  expect(screen.getByTestId("surface")).toBeInTheDocument();
  fireEvent.click(screen.getByText("toggle"));
  act(() => vi.advanceTimersByTime(321));
  expect(screen.queryByTestId("surface")).toBeNull();
});
