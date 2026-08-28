import { describe, expect, it } from "vitest";
import { makeAssignment, makePlayer } from "../../test/game-fixtures";
import {
  assignmentState,
  experienceProgress,
  formatGameDate,
  rankRequirement,
} from "./game-presentation";
import { validateAvatar } from "./game-profile-validation";
import { gameReturnPath } from "./game-navigation";

describe("game presentation", () => {
  const now = Date.parse("2026-08-28T08:00:00Z");
  it("clamps experience and safely handles terminal or malformed ranks", () => {
    const player = makePlayer();
    expect(experienceProgress(player)).toEqual({ percent: 36, remaining: 640 });
    expect(experienceProgress({ ...player, totalXp: -2 }).percent).toBe(0);
    expect(experienceProgress({ ...player, totalXp: 2000 })).toEqual({
      percent: 100,
      remaining: 0,
    });
    expect(experienceProgress({ ...player, nextLevel: null }).percent).toBe(
      100,
    );
    expect(
      experienceProgress({ ...player, nextLevel: { ...player.level } }).percent,
    ).toBe(100);
  });
  it.each([
    [{ status: "completed", endsAt: "2026-08-01" }, "completed"],
    [{ status: "cancelled", endsAt: "2026-08-01" }, "cancelled"],
    [{ endsAt: "2026-08-28T08:00:00Z" }, "expired"],
    [{ startsAt: "2026-09-01" }, "waiting"],
    [{ status: "assigned", minLevel: 5 }, "locked"],
    [{ status: "assigned", maxLevel: 0 }, "locked"],
    [{ status: "active" }, "active"],
    [{ status: "assigned", startsAt: "2026-08-28T08:00:00Z" }, "ready"],
  ] as const)(
    "resolves state with terminal-state precedence: %o",
    (overrides, kind) => {
      expect(assignmentState(makeAssignment(overrides), 1, now).kind).toBe(
        kind,
      );
    },
  );
  it("formats rank zero and invalid dates explicitly", () => {
    expect(rankRequirement(makeAssignment({ minLevel: 0, maxLevel: 0 }))).toBe(
      "等级 0—0",
    );
    expect(formatGameDate("invalid")).toBe("时间待确认");
  });
  it("only carries an internal assignment return path", () => {
    expect(gameReturnPath("/play/a/content/b", null)).toBe("/play/a");
    expect(gameReturnPath("/profile", { returnTo: "/play/a" })).toBe("/play/a");
    expect(
      gameReturnPath("/profile", { returnTo: "https://example.com" }),
    ).toBeUndefined();
    expect(
      gameReturnPath("/profile", { returnTo: "/play/a/content/b" }),
    ).toBeUndefined();
  });
  it("keeps an active journey accessible after a rank-up", () => {
    expect(
      assignmentState(makeAssignment({ status: "active", maxLevel: 1 }), 2, now)
        .kind,
    ).toBe("active");
  });
  it("validates avatar MIME and size before upload", () => {
    expect(
      validateAvatar({ type: "image/png", size: 2 * 1024 * 1024 }),
    ).toBeUndefined();
    expect(validateAvatar({ type: "image/svg+xml", size: 10 })).toContain(
      "JPG",
    );
    expect(
      validateAvatar({ type: "image/jpeg", size: 2 * 1024 * 1024 + 1 }),
    ).toContain("2 MB");
  });
});
