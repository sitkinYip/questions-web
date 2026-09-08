import { uiCopy } from "@/config/ui-copy";
import type { GameAssignmentSummary, GamePlayer } from "@/api/game.contracts";

export function experienceProgress(player: GamePlayer) {
  if (!player.nextLevel) return { percent: 100, remaining: 0 };
  const span = player.nextLevel.minTotalXp - player.level.minTotalXp;
  return {
    percent:
      span > 0
        ? Math.min(
            100,
            Math.max(
              0,
              ((player.totalXp - player.level.minTotalXp) / span) * 100,
            ),
          )
        : 100,
    remaining: Math.max(0, player.nextLevel.minTotalXp - player.totalXp),
  };
}

export function assignmentState(
  item: GameAssignmentSummary,
  rank: number,
  now: number,
) {
  if (item.status === "completed")
    return {
      kind: "completed",
      label: uiCopy.gamePresentation.completed,
      action: uiCopy.gamePresentation.replay,
      canStart: false,
    } as const;
  if (item.status === "cancelled")
    return {
      kind: "cancelled",
      label: uiCopy.gamePresentation.revoked,
      action: uiCopy.gamePresentation.details,
      canStart: false,
    } as const;
  if (item.endsAt && Date.parse(item.endsAt) <= now)
    return {
      kind: "expired",
      label: uiCopy.gamePresentation.expired,
      action: uiCopy.gamePresentation.details,
      canStart: false,
    } as const;
  if (item.startsAt && Date.parse(item.startsAt) > now)
    return {
      kind: "waiting",
      label: uiCopy.gamePresentation.waiting,
      action: uiCopy.gamePresentation.details,
      canStart: false,
    } as const;
  if (
    item.status === "assigned" &&
    (rank < item.minLevel || (item.maxLevel !== null && rank > item.maxLevel))
  )
    return {
      kind: "locked",
      label: uiCopy.gamePresentation.levelBlocked,
      action: uiCopy.gamePresentation.details,
      canStart: false,
    } as const;
  if (item.status === "active")
    return {
      kind: "active",
      label: uiCopy.gamePresentation.active,
      action: uiCopy.gamePresentation.continueJourney,
      canStart: false,
    } as const;
  return {
    kind: "ready",
    label: uiCopy.gamePresentation.available,
    action: uiCopy.gamePresentation.start,
    canStart: true,
  } as const;
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  year: "numeric",
});
export function formatGameDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? uiCopy.gamePresentation.unknownTime
    : dateFormatter.format(date);
}

export function rankRequirement(item: GameAssignmentSummary) {
  return item.maxLevel === null
    ? uiCopy.gamePresentation.minimumLevel(item.minLevel)
    : uiCopy.gamePresentation.levelRange(item.minLevel, item.maxLevel);
}
