export type QuestId = string;

export type QuestKind = "text" | "choice";

export type QuestAvailability =
  | { status: "available" }
  | { status: "not-started"; startsAt: number }
  | { status: "ended"; endedAt: number };

export interface QuestOption {
  key: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface QuestContentItem {
  text?: string;
  hint?: string;
  imageUrl?: string;
  imageUrls: readonly string[];
  videoUrl?: string;
}

export type QuestClueKind =
  "text" | "image" | "video" | "link" | "letter" | "bless";

export interface QuestClue {
  id: string;
  kind: QuestClueKind;
  title?: string;
  content: string;
  autoPlay: boolean;
  url?: string;
  imageUrls: readonly string[];
  href?: string;
  linkTarget?: "internal" | "external";
  tips?: string;
}

export interface MultiQuestClue {
  id: string;
  qas: string;
  content: string;
  title?: string;
  buttonText?: string;
  description?: string;
  revision: string;
}

export interface QuestFinalDestination {
  href: string;
  target: "internal" | "external";
}

export interface QuestRank {
  code: string;
  name: string;
  isSpecial: boolean;
  numericValue: number;
}

export type QuestCompletionTransition =
  | { type: "complete" }
  | { type: "manual"; targetIndex: number }
  | { type: "auto"; targetIndex: number };

export interface Quest {
  id: QuestId;
  step: number;
  revision: string;
  kind: QuestKind;
  title?: string;
  displayName?: string;
  answerPlaceholder?: string;
  prompt: string;
  content: readonly QuestContentItem[];
  clues: readonly QuestClue[];
  acceptedAnswers: readonly string[];
  options: readonly QuestOption[];
  startsAt?: number;
  endsAt?: number;
  penaltyDurationsMs: readonly number[];
  autoNext: boolean;
  isFinal: boolean;
  finalDestination?: QuestFinalDestination;
  rank?: QuestRank;
  mainAudioUrl?: string;
  backgroundImageUrl?: string;
  avatarUrl?: string;
}

export type AttemptStatus =
  "unanswered" | "incorrect" | "penalized" | "completed";

export interface QuestAttempt {
  questId: QuestId;
  status: AttemptStatus;
  input: string;
  wrongCount: number;
  penaltyEndsAt: number | null;
  completedAt: number | null;
}

export type SessionStatus = "active" | "completed";

export interface QuestSession {
  sessionId: string;
  userId: string;
  quests: readonly Quest[];
  activeIndex: number;
  attempts: Readonly<Record<QuestId, QuestAttempt>>;
  status: SessionStatus;
}

export type SubmitAnswerResult =
  | {
      type: "blocked";
      reason: "not-started" | "ended" | "penalized";
      session: QuestSession;
    }
  | { type: "incorrect"; session: QuestSession; attempt: QuestAttempt }
  | { type: "correct"; session: QuestSession; attempt: QuestAttempt };
