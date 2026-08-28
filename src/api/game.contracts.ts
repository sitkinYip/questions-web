// Generated from sitkin-pb-backend-management/backend/contracts/game.ts.
export interface GameRank {
  id: string;
  order: number;
  name: string;
  minTotalXp: number;
  visualConfig: unknown;
}
export interface GamePlayer {
  id: string;
  account: string;
  displayName: string;
  avatar: string;
  mustChangePassword: boolean;
  totalXp: number;
  level: GameRank;
  nextLevel: GameRank | null;
}
export interface GamePresentation {
  backgroundMode?: "inherit" | "custom" | "none";
  hideTitle?: boolean;
  bgmMode?: "inherit" | "custom" | "silent";
  bgmUrl?: string;
  backgroundUrl?: string;
  completionStyle?: "normal" | "finale";
}
export interface GameContentBlock {
  text: string;
  hint: string;
  imageUrl: string;
  imageUrls: string[];
  videoUrl: string;
}
export interface GameOption {
  key: string;
  text: string;
  imageUrl: string;
  videoUrl: string;
}
export interface GameQuestion {
  id: string;
  kind: "text" | "choice";
  title: string;
  placeholder: string;
  content: GameContentBlock[];
  options: GameOption[];
}
export interface GameAssignmentSummary {
  id: string;
  player: string;
  session: string;
  status: "assigned" | "active" | "completed" | "cancelled";
  order: number;
  startsAt: string;
  endsAt: string;
  startedAt: string;
  completedAt: string;
  previousAssignment: string;
  title: string;
  description: string;
  minLevel: number;
  maxLevel: number | null;
  completedLevels: number;
  totalLevels: number;
}
export interface GameLevel {
  id: string;
  position: number;
  xp: number;
  autoNext: boolean;
  completedAt: string;
  wrongCount: number;
  cooldownUntil: string;
  locked: boolean;
  presentationOverride: GamePresentation;
  question: GameQuestion | null;
  lastAnswer: string;
}
export interface GameClue {
  trigger: "start" | "level_completed" | "session_completed" | "manual";
  id: string;
  sessionLevel: string;
  kind: "text" | "image" | "video" | "link" | "letter" | "bless";
  position: number;
  narrative: string;
  autoPlay: boolean;
  content: {
    title: string;
    text: string;
    url: string;
    imageUrls: string[];
    buttonText: string;
    description?: string;
    tips?: string;
  };
  unlockedAt: string;
}
export type GameCompletionTarget =
  { kind: "narrative"; id: string } | { kind: "link"; url: string };
export interface GameAssignment extends GameAssignmentSummary {
  presentation: GamePresentation;
  completionTarget: GameCompletionTarget | null;
  currentIndex: number;
  clues: GameClue[];
  levels: GameLevel[];
  serverTime: string;
}
export interface GameAnswerResult {
  result: "correct" | "incorrect" | "already_completed";
  xpDelta: number;
  rewardIds: string[];
  assignment: GameAssignment;
  player: GamePlayer;
}
export interface GameReward {
  id: string;
  player: string;
  assignment: string;
  quantity: number;
  status: "available" | "redeemed" | "voided";
  claimDetails: string;
  redeemedAt: string;
  created: string;
  snapshot: {
    id: string;
    name: string;
    image: string;
    description: string;
    claimMethod: "staff" | "location" | "locker";
    publicInstructions: string;
  };
}
export interface GameNotification {
  id: string;
  title: string;
  content: string;
  popupTitle: string;
  buttonText: string;
  sentAt: string;
  readAt: string;
  assignmentId: string;
}
export interface GamePenalty {
  type: "lock" | "cooldown";
  seconds?: number;
}
export interface AdminQuestion extends GameQuestion {
  seriesKey: string;
  revision: number;
  status: "draft" | "published" | "archived";
  acceptedAnswers: string[];
  usage?: AdminQuestionUsage;
}
export interface AdminSessionReference {
  id: string;
  title: string;
  revision: number;
  status: "draft" | "published" | "archived";
}
export interface AdminQuestionUsage {
  online: AdminSessionReference[];
  drafts: AdminSessionReference[];
  historyCount: number;
  canEdit: boolean;
  canDelete: boolean;
}
export interface AdminAssignmentSummary extends GameAssignmentSummary {
  sessionStatus: "draft" | "published" | "archived";
}
export interface AdminAssignment extends GameAssignment {
  sessionStatus: "draft" | "published" | "archived";
}
export interface AdminSessionLevel {
  id?: string;
  question: string;
  position?: number;
  xp: number;
  autoNext?: boolean;
  penaltyPolicy?: GamePenalty[];
  presentationOverride?: GamePresentation;
}
export interface AdminClue {
  id?: string;
  sessionLevel?: string;
  levelIndex?: number;
  trigger: "start" | "level_completed" | "session_completed" | "manual";
  kind: GameClue["kind"];
  content: GameClue["content"];
  narrative?: string;
  autoPlay?: boolean;
}
export interface AdminRewardRule {
  id?: string;
  sessionLevel?: string;
  levelIndex?: number;
  trigger: "level_completed" | "session_completed";
  reward: string;
  quantity: number;
}
export interface AdminSession {
  id: string;
  seriesKey: string;
  revision: number;
  status: "draft" | "published" | "archived";
  title: string;
  description: string;
  minLevel: string;
  maxLevel: string;
  presentation: GamePresentation;
  completionTarget: GameCompletionTarget | null;
  levels: AdminSessionLevel[];
  clues: AdminClue[];
  rewardRules: AdminRewardRule[];
  assignmentCounts?: {
    total: number;
    assigned: number;
    active: number;
    completed: number;
    cancelled: number;
  };
}
export interface AdminRewardDefinition {
  id: string;
  name: string;
  image: string;
  description: string;
  claimMethod: "staff" | "location" | "locker";
  publicInstructions: string;
  active: boolean;
}
export interface AdminNarrative {
  id: string;
  seriesKey: string;
  revision: number;
  status: "draft" | "published" | "archived";
  kind: "letter" | "bless";
  title: string;
  payload: Record<string, unknown>;
}
export interface AdminCatalog {
  players: (GamePlayer & { status: "active" | "disabled" })[];
  ranks: GameRank[];
  questions: AdminQuestion[];
  sessions: AdminSession[];
  rewards: AdminRewardDefinition[];
  narratives: AdminNarrative[];
}
export interface AssignmentBatchResult {
  target: "all" | "selected";
  recipientIds: string[];
  results: {
    playerId: string;
    status:
      "assigned" | "skipped_active" | "skipped_completed" | "skipped_disabled";
    assignmentId?: string;
  }[];
}
