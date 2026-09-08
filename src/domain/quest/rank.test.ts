import { describe, expect, it } from "vitest";
import type { Quest } from "@/domain/quest/types";
import {
  extractHighestRank,
  isRankUpgradeEligible,
  parseQuestRank,
} from "@/domain/quest/rank";

function questWithRank(code: string, name: string): Quest {
  return {
    id: `quest-${code}-${name}`,
    step: 1,
    revision: "r1",
    kind: "text",
    prompt: "question",
    content: [],
    clues: [],
    acceptedAnswers: ["answer"],
    options: [],
    penaltyDurationsMs: [],
    autoNext: false,
    isFinal: false,
    rank: parseQuestRank(code, name) ?? undefined,
  };
}

describe("quest ranks", () => {
  it("keeps Rank 1 for display but does not treat it as an upgrade", () => {
    const rank = parseQuestRank(" 1 ", "探索咪");
    expect(rank).toMatchObject({ code: "1", name: "探索咪", numericValue: 1 });
    expect(rank && isRankUpgradeEligible(rank)).toBe(false);
  });

  it("selects the highest numeric rank in a multi quest", () => {
    expect(
      extractHighestRank([
        questWithRank("2", "勇者咪"),
        questWithRank("5", "英雄咪"),
        questWithRank("3", "守护咪"),
      ]),
    ).toMatchObject({ code: "5", name: "英雄咪" });
  });

  it("prioritizes the last special rank over numeric ranks", () => {
    expect(
      extractHighestRank([
        questWithRank("9", "数字等级"),
        questWithRank("legend", "传奇"),
        questWithRank("myth", "神话"),
      ]),
    ).toMatchObject({ code: "myth", name: "神话", isSpecial: true });
  });
});
