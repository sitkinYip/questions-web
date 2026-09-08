// Generated from sitkin-pb-backend-management/backend/contracts/game.ts.
export type ExtraJson =
  string | number | boolean | ExtraJson[] | { [key: string]: ExtraJson };
export interface GameExtra {
  extra?: Record<string, ExtraJson>;
  extraDisplay?: { key: string; label: string; text: string }[];
}
export interface GameRank {
  id: string;
  order: number;
  name: string;
  defaultName?: string;
  customTitle?: string | null;
  minTotalXp: number;
  visualConfig: unknown;
}
export interface GamePlayer extends GameExtra {
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
export interface GameLivePresentation {
  backgroundMode?: "inherit" | "custom" | "none";
  hideTitle?: boolean;
  bgmMode?: "inherit" | "custom" | "silent";
  bgmUrl?: string;
  backgroundUrl?: string;
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
export interface GameLevel extends GameExtra {
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
export interface GameClueContent {
  title: string;
  text: string;
  url: string;
  imageUrls: string[];
  buttonText: string;
  description?: string;
  tips?: string;
}
export interface GameClue {
  trigger:
    | "start"
    | "level_completed"
    | "session_completed"
    | "manual"
    | "question_completed";
  id: string;
  source: "session" | "question";
  definitionId: string;
  question: string;
  sessionLevel: string;
  kind: "text" | "image" | "video" | "link" | "letter" | "bless";
  position: number;
  narrative: string;
  autoPlay: boolean;
  content: GameClueContent;
  unlockedAt: string;
}
export interface GameClueEffect {
  type: "clue";
  clueId: string;
  autoPlay?: boolean;
}
export type GameCompletionTarget =
  { kind: "narrative"; id: string } | { kind: "link"; url: string };
export interface GameAssignment extends GameAssignmentSummary, GameExtra {
  presentation: GamePresentation;
  completionTarget: GameCompletionTarget | null;
  currentIndex: number;
  clues: GameClue[];
  levels: GameLevel[];
  serverTime: string;
  transitionEffects?: GameClueEffect[];
}
export interface GameAnswerResult {
  result: "correct" | "incorrect" | "already_completed";
  xpDelta: number;
  rewardIds: string[];
  effects?: GameClueEffect[];
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
  fuzzyMatch: boolean;
  groupName: string;
  commonClueCount: number;
  usage?: AdminQuestionUsage;
}
export interface AdminQuestionClue {
  id: string;
  question: string;
  position: number;
  kind: "text" | "image" | "video" | "link";
  content: GameClueContent;
  autoPlay: boolean;
  status: "active" | "archived";
  updated: string;
}
export interface AdminQuestionClueInput {
  id?: string;
  position?: number;
  kind: AdminQuestionClue["kind"];
  content: GameClueContent;
  autoPlay?: boolean;
}
export interface AdminQuestionClueSet {
  items: AdminQuestionClue[];
  version: string;
}
export interface AdminQuestionClueSaveInput {
  requestId: string;
  reason: string;
  expectedVersion: string;
  clues: AdminQuestionClueInput[];
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
  position?: number;
  sessionLevel?: string;
  levelIndex?: number;
  trigger: "start" | "level_completed" | "session_completed" | "manual";
  kind: GameClue["kind"];
  content: GameClueContent;
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
  liveSettingsVersion: string;
  assignmentCounts?: {
    total: number;
    assigned: number;
    active: number;
    completed: number;
    cancelled: number;
  };
}
export interface AdminSessionLiveSettingsInput {
  requestId: string;
  reason: string;
  expectedVersion: string;
  title?: string;
  description?: string;
  presentation?: GameLivePresentation;
  levels?: { id: string; presentationOverride: GameLivePresentation }[];
  clues?: {
    id: string;
    position: number;
    content: GameClueContent;
    autoPlay: boolean;
  }[];
}
export interface AdminSessionLiveSettingsResult {
  id: string;
  version: string;
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
  capabilities?: { playerTitles: boolean; extraConfig: boolean };
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
export interface PlayerLevelTitle {
  id: string;
  player: string;
  level: string;
  name: string;
  status: "active" | "revoked";
  revision: number;
  updated: string;
}
export type ExtraScope =
  | "global"
  | "rank"
  | "question"
  | "session"
  | "assignment"
  | "session_level"
  | "assignment_level";
export type ExtraContext = "profile" | "assignment" | "level";
export interface ExtraField {
  type: "object" | "array" | "string" | "url" | "number" | "boolean";
  label?: string;
  required?: boolean;
  default?: ExtraJson;
  properties?: Record<string, ExtraField>;
  items?: ExtraField;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: string[];
}
export interface ExtraDefinition {
  id: string;
  key: string;
  label: string;
  status: "active" | "disabled";
  revision: number;
  updated: string;
  schema: {
    scopes: ExtraScope[];
    contexts: ExtraContext[];
    visibility: "player" | "admin";
    renderer: "none" | "text";
    fields: ExtraField;
  };
}
export interface ExtraConfig {
  id: string;
  definition: string;
  scopeType: ExtraScope;
  scopeId: string;
  assignment: string;
  player: string;
  targetKey: string;
  recipientKey: string;
  mode: "value" | "suppress";
  status: "active" | "revoked";
  extra: Record<string, ExtraJson>;
  revision: number;
  lastRequestId: string;
  updated: string;
}
export interface ExtraPreview {
  version: string;
  recipientIds: string[];
  skippedIds: string[];
  normalizedExtra: Record<string, ExtraJson>;
  items: { playerId: string; before: ExtraConfig | null; action: string }[];
}

/** Ephemeral editor previews. No persistence, answer keys or recipient data. */
export const EDITOR_PREVIEW_VERSION = 1;
export type EditorPreviewDraft =
  | { kind: "question"; value: GameQuestion }
  | { kind: "notification"; value: Pick<GameNotification, "title" | "content" | "popupTitle" | "buttonText"> };
export interface EditorPreviewMessage {
  type: "sitkin:preview:update";
  version: typeof EDITOR_PREVIEW_VERSION;
  channel: string;
  revision: number;
  reset: number;
  theme: "light" | "dark";
  state: "unanswered" | "incorrect" | "completed" | "unread" | "read" | "popup";
  draft: EditorPreviewDraft;
}
