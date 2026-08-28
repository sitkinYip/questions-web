import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useGamePresentation } from "./useGamePresentation";
import type { QuestClue } from "../../domain/quest/types";

const video: QuestClue = {
  id: "video",
  kind: "video",
  content: "",
  autoPlay: true,
  imageUrls: [],
  url: "https://assets.example/clue.mp4",
};
afterEach(() => vi.useRealTimers());
it("keeps the original 1500ms auto-next delay and cancels it on navigation", () => {
  vi.useFakeTimers();
  const advance = vi.fn();
  const { result } = renderHook(() => useGamePresentation(advance));
  act(() => result.current.start([{ type: "advance", index: 1, delay: 1500 }]));
  act(() => vi.advanceTimersByTime(1499));
  expect(advance).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(advance).toHaveBeenCalledWith(1);
  act(() => result.current.start([{ type: "advance", index: 2, delay: 1500 }]));
  act(() => result.current.reset());
  act(() => vi.advanceTimersByTime(1500));
  expect(advance).toHaveBeenCalledTimes(1);
});
it("cancels auto-next when an automatic video is closed early", () => {
  const advance = vi.fn();
  const { result } = renderHook(() => useGamePresentation(advance));
  act(() =>
    result.current.start([
      { type: "clue", clue: video },
      { type: "advance", index: 1, delay: 0 },
    ]),
  );
  expect(result.current.media?.type).toBe("video");
  act(() => result.current.closeMedia());
  expect(result.current.media).toBeNull();
  expect(advance).not.toHaveBeenCalled();
});
it("advances when the automatic video actually ends", () => {
  const advance = vi.fn();
  const { result } = renderHook(() => useGamePresentation(advance));
  act(() =>
    result.current.start([
      { type: "clue", clue: video },
      { type: "advance", index: 1, delay: 0 },
    ]),
  );
  act(() => result.current.videoEnded());
  expect(advance).toHaveBeenCalledWith(1);
  expect(result.current.media).toBeNull();
});
it("preserves final celebration, clue, combination and destination ordering", () => {
  const { result } = renderHook(() => useGamePresentation(vi.fn()));
  const combination = {
    id: "combined",
    qas: "",
    revision: "r1",
    content: "合并线索",
  };
  const destination = {
    href: "/play/a/content/letter",
    target: "internal" as const,
  };
  act(() =>
    result.current.start([
      { type: "completion", variant: "final" },
      { type: "clue", clue: video },
      { type: "combination", clue: combination },
      { type: "destination", destination },
    ]),
  );
  expect(result.current.completion).toBe("final");
  expect(result.current.media).toBeNull();
  act(() => result.current.continueCompletion());
  expect(result.current.media?.type).toBe("video");
  // A final sequence still reveals its destination when the viewer is dismissed.
  act(() => result.current.closeMedia());
  expect(result.current.combination).toEqual(combination);
  expect(result.current.destination).toBeNull();
  act(() => result.current.closeCombination());
  expect(result.current.destination).toEqual(destination);
});
it("waits for the normal last-question clue before multi completion", () => {
  const { result } = renderHook(() => useGamePresentation(vi.fn()));
  act(() =>
    result.current.start([
      { type: "clue", clue: { ...video, kind: "text", content: "文字线索" } },
      { type: "completion", variant: "multi" },
    ]),
  );
  expect(result.current.textClue?.content).toBe("文字线索");
  expect(result.current.completion).toBeNull();
  act(() => result.current.closeText());
  expect(result.current.completion).toBe("multi");
});
it("does not leave an auto-next timer running after unmount", () => {
  vi.useFakeTimers();
  const advance = vi.fn();
  const { result, unmount } = renderHook(() => useGamePresentation(advance));
  act(() => result.current.start([{ type: "advance", index: 1, delay: 1500 }]));
  unmount();
  act(() => vi.advanceTimersByTime(2000));
  expect(advance).not.toHaveBeenCalled();
});
