import type {
  GameAssignmentSummary,
  GamePlayer,
} from "../../api/game.contracts";

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
      label: "故事已解开",
      action: "重温旅程",
      canStart: false,
    } as const;
  if (item.status === "cancelled")
    return {
      kind: "cancelled",
      label: "旅程已撤回",
      action: "查看详情",
      canStart: false,
    } as const;
  if (item.endsAt && Date.parse(item.endsAt) <= now)
    return {
      kind: "expired",
      label: "已过开放时间",
      action: "查看详情",
      canStart: false,
    } as const;
  if (item.startsAt && Date.parse(item.startsAt) > now)
    return {
      kind: "waiting",
      label: "静候启程",
      action: "查看详情",
      canStart: false,
    } as const;
  if (
    item.status === "assigned" &&
    (rank < item.minLevel || (item.maxLevel !== null && rank > item.maxLevel))
  )
    return {
      kind: "locked",
      label: "等级暂不符合",
      action: "查看详情",
      canStart: false,
    } as const;
  if (item.status === "active")
    return {
      kind: "active",
      label: "探索进行中",
      action: "继续探索",
      canStart: false,
    } as const;
  return {
    kind: "ready",
    label: "可以出发",
    action: "开启旅程",
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
    ? "时间待确认"
    : dateFormatter.format(date);
}

export function rankRequirement(item: GameAssignmentSummary) {
  return item.maxLevel === null
    ? `等级 ${item.minLevel} 及以上`
    : `等级 ${item.minLevel}—${item.maxLevel}`;
}
