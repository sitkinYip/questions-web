import { expect, it } from "vitest";
import { sessionFixture } from "../../../e2e/session-preview-fixture";
import {
  initialSessionSimulation,
  newlyVisibleEffects,
  sessionSnapshot,
} from "./session-simulation";
import {
  answerPresentationSteps,
  resolveLevelPresentation,
  startPresentationSteps,
} from "@/features/game/session-presentation";
it("reveals start, level, common and manual clues at their simulated stages without changing the definition", () => {
  const d = sessionFixture().assignment,
    original = structuredClone(d);
  const brief = sessionSnapshot(d, "brief", new Set(), new Set());
  const start = sessionSnapshot(d, "play", new Set(), new Set());
  expect(brief.clues).toEqual([]);
  expect(start.clues.map((c) => c.id)).toEqual(["开场线索"]);
  expect(start.levels[1].question).toBeNull();
  expect(startPresentationSteps(brief, start).map((s) => s.type)).toEqual([
    "clue",
  ]);
  const next = sessionSnapshot(
    d,
    "play",
    new Set(["l1"]),
    new Set(["手动线索"]),
  );
  expect(next.levels[1].question?.title).toBe("题目2");
  expect(newlyVisibleEffects(start, next).map((c) => c.clueId)).toEqual([
    "过关线索",
    "通用线索",
    "手动线索",
  ]);
  expect(
    answerPresentationSteps(
      start,
      next,
      "l1",
      newlyVisibleEffects(start, next),
    ).map((s) => s.type),
  ).toEqual(["clue", "clue", "clue", "advance"]);
  expect(d).toEqual(original);
});
it("uses the shared finale order and never replays historical unlocks", () => {
  const d = sessionFixture().assignment;
  const before = sessionSnapshot(d, "play", new Set(["l1"]), new Set());
  const after = sessionSnapshot(
    d,
    "completed",
    new Set(["l1", "l2"]),
    new Set(),
  );
  expect(after.clues.some((c) => c.id === "手动线索")).toBe(false);
  expect(
    answerPresentationSteps(
      before,
      after,
      "l2",
      newlyVisibleEffects(before, after),
    ).map((s) => s.type),
  ).toEqual(["completion", "combination", "destination"]);
  expect(newlyVisibleEffects(after, after)).toEqual([]);
});
it("resolves the bookmarked level by ID after reorder and clamps removed levels", () => {
  const d = sessionFixture().assignment;
  expect(
    initialSessionSimulation(d, { stage: "play", levelId: "l2" }).completed,
  ).toEqual(new Set(["l1"]));
  expect(
    initialSessionSimulation(
      { ...d, levels: [...d.levels].reverse() },
      { stage: "play", levelId: "l2" },
    ).index,
  ).toBe(0);
  expect(
    initialSessionSimulation(d, { stage: "play", levelId: "deleted" }).index,
  ).toBe(0);
});
it("shares explicit background/BGM disable and inherited title behavior", () => {
  const d = sessionFixture().assignment;
  d.presentation = {
    hideTitle: true,
    backgroundUrl: "https://example.com/bg.png",
    bgmUrl: "https://example.com/bgm.mp3",
  };
  expect(resolveLevelPresentation(d, {})).toEqual({
    hideTitle: true,
    background: d.presentation.backgroundUrl,
    bgmUrl: d.presentation.bgmUrl,
  });
  expect(
    resolveLevelPresentation(d, {
      hideTitle: false,
      backgroundMode: "none",
      bgmMode: "silent",
    }),
  ).toEqual({ hideTitle: false, background: undefined, bgmUrl: undefined });
});
