import type {
  GameAssignmentSummary,
  GameNotification,
  GamePlayer,
  GameReward,
} from "@/api/game.contracts";

export function makePlayer(): GamePlayer {
  return {
    id: "preview-player",
    account: "wayfarer",
    displayName: "远航者",
    avatar: "",
    mustChangePassword: false,
    totalXp: 360,
    level: {
      id: "rank-1",
      order: 1,
      name: "初见",
      minTotalXp: 0,
      visualConfig: {},
    },
    nextLevel: {
      id: "rank-2",
      order: 2,
      name: "寻星者",
      minTotalXp: 1000,
      visualConfig: {},
    },
  };
}
export function makeAssignment(
  overrides: Partial<GameAssignmentSummary> = {},
): GameAssignmentSummary {
  return {
    id: "preview-journey",
    player: "preview-player",
    session: "preview-session",
    status: "active",
    order: 0,
    startsAt: "",
    endsAt: "",
    startedAt: "2026-08-28T08:00:00Z",
    completedAt: "",
    previousAssignment: "",
    title: "星辰探险",
    description:
      "星图上缺失的那一角，藏着谁留下的秘密？循着微光，寻找故事的另一面。",
    minLevel: 1,
    maxLevel: null,
    completedLevels: 2,
    totalLevels: 6,
    ...overrides,
  };
}
export function makeRewards(): GameReward[] {
  return [
    {
      id: "preview-reward",
      player: "preview-player",
      assignment: "preview-journey",
      quantity: 1,
      status: "available",
      claimDetails: "到入口处寻找带有星星标记的信封。",
      redeemedAt: "",
      created: "2026-08-28T09:00:00Z",
      snapshot: {
        id: "star",
        name: "星辰纪念章",
        image: "",
        description: "为找到答案的你，留下一小片星空。",
        claimMethod: "staff",
        publicInstructions:
          "向现场工作人员出示这份礼物，领取后由工作人员核销。",
      },
    },
    {
      id: "preview-reward-2",
      player: "preview-player",
      assignment: "preview-journey",
      quantity: 1,
      status: "redeemed",
      claimDetails: "",
      redeemedAt: "2026-08-27T10:00:00Z",
      created: "2026-08-27T09:00:00Z",
      snapshot: {
        id: "journal",
        name: "远航手记",
        image: "",
        description: "把一路遇见的风景，和没有说完的故事一起收藏。",
        claimMethod: "staff",
        publicInstructions: "",
      },
    },
  ];
}
export function makeNotifications(): GameNotification[] {
  return [
    {
      id: "preview-note",
      title: "新的线索已送达",
      content: "请到入口领取下一份线索。\n\n有些答案，藏在你刚刚路过的地方。",
      popupTitle: "远方来信",
      buttonText: "收到消息",
      sentAt: "2026-08-28T09:12:00Z",
      readAt: "",
      assignmentId: "preview-journey",
    },
    {
      id: "preview-note-2",
      title: "欢迎来到故事里",
      content: "带上好奇心，慢慢探索。每一条线索，都值得被认真看见。",
      popupTitle: "",
      buttonText: "",
      sentAt: "2026-08-27T08:00:00Z",
      readAt: "2026-08-27T08:05:00Z",
      assignmentId: "",
    },
  ];
}
