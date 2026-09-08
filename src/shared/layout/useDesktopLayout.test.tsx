import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  DESKTOP_LAYOUT_QUERY,
  useDesktopLayout,
} from "@/shared/layout/useDesktopLayout";

afterEach(() => vi.unstubAllGlobals());

it("uses the shared boundary and follows media changes with cleanup", () => {
  let matches = false;
  const listeners = new Set<() => void>();
  const media = {
    get matches() {
      return matches;
    },
    addEventListener: vi.fn((_event: string, listener: () => void) =>
      listeners.add(listener),
    ),
    removeEventListener: vi.fn((_event: string, listener: () => void) =>
      listeners.delete(listener),
    ),
  };
  const matchMedia = vi.fn(() => media);
  vi.stubGlobal("matchMedia", matchMedia);
  const hook = renderHook(() => useDesktopLayout());
  expect(hook.result.current).toBe(false);
  expect(matchMedia).toHaveBeenCalledWith(DESKTOP_LAYOUT_QUERY);
  act(() => {
    matches = true;
    listeners.forEach((listener) => listener());
  });
  expect(hook.result.current).toBe(true);
  act(() => {
    matches = false;
    listeners.forEach((listener) => listener());
  });
  expect(hook.result.current).toBe(false);
  hook.unmount();
  expect(listeners.size).toBe(0);
});

it("falls back to the existing mobile layout without matchMedia", () => {
  vi.stubGlobal("matchMedia", undefined);
  const hook = renderHook(() => useDesktopLayout());
  expect(hook.result.current).toBe(false);
});
