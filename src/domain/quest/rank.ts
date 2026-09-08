import type { Quest, QuestRank } from "@/domain/quest/types.ts";

export function parseQuestRank(
  rawRank?: string | null,
  rawName?: string | null,
): QuestRank | null {
  const code = rawRank?.trim() ?? "";
  const name = rawName?.trim() ?? "";
  if (!code || !name) return null;
  const numericValue = Number(code);
  const isNumeric = Number.isFinite(numericValue);
  return {
    code,
    name,
    isSpecial: !isNumeric,
    numericValue: isNumeric ? numericValue : Number.POSITIVE_INFINITY,
  };
}

export function isRankUpgradeEligible(rank: QuestRank) {
  return rank.isSpecial || rank.numericValue > 1;
}

export function extractHighestRank(quests: readonly Quest[]): QuestRank | null {
  const eligible = quests
    .map((quest) => quest.rank)
    .filter((rank): rank is QuestRank => Boolean(rank))
    .filter(isRankUpgradeEligible);
  if (eligible.length === 0) return null;
  const special = eligible.filter((rank) => rank.isSpecial);
  if (special.length > 0) return special[special.length - 1];
  return eligible.reduce((highest, current) =>
    current.numericValue > highest.numericValue ? current : highest,
  );
}
