export interface AnalyticsProgress {
  activeStep: number;
  completed: number;
  total: number;
  sessionStatus: "active" | "completed";
}

export type AnalyticsEvent =
  | {
      name: "session_viewed";
      mode: "single" | "multiple";
      steps: readonly number[];
      progress: AnalyticsProgress;
    }
  | {
      name: "quest_viewed";
      questId: string;
      step: number;
      title?: string;
      question: string;
      kind: "text" | "choice";
      mode: "single" | "multiple";
      attemptStatus: "unanswered" | "incorrect" | "penalized" | "completed";
      progress: AnalyticsProgress;
    }
  | {
      name: "answer_submitted";
      questId: string;
      step: number;
      title?: string;
      question: string;
      kind: "text" | "choice";
      answer: string;
      normalizedAnswer: string;
      acceptedAnswers: readonly string[];
      options: readonly { key: string; text?: string }[];
      outcome: "empty" | "blocked" | "correct" | "incorrect";
      blockedReason?: "not-started" | "ended" | "penalized";
      attemptStatus: "unanswered" | "incorrect" | "penalized" | "completed";
      wrongCount: number;
      penaltyEndsAt: number | null;
      progress: AnalyticsProgress;
    }
  | {
      name: "media_opened";
      kind: "image" | "video";
      source: "session";
      count: number;
      step: number;
      title?: string;
      urls: readonly string[];
      poster?: string;
    }
  | {
      name: "clue_opened";
      clueId: string;
      kind: "text" | "image" | "video" | "link" | "letter";
      step?: number;
      title?: string;
      content: string;
      urls: readonly string[];
      automatic: boolean;
    }
  | {
      name: "notification_state";
      notificationId: string;
      title: string;
      popupTitle?: string;
      content: string;
      state: "opened" | "closed";
    }
  | {
      name: "bgm_state";
      state: "playing" | "paused" | "authorization_blocked";
      reason: "automatic" | "user" | "media";
      audioUrl?: string;
    }
  | {
      name: "letter_state";
      letterId: string;
      from: string;
      title?: string;
      state: "opened" | "closed" | "completed";
      variant: "modern" | "classical" | "magic";
    }
  | {
      name: "destination_opened";
      target: "internal" | "external";
      href: string;
    };

export interface AnalyticsEnvelope {
  version: 2;
  sessionId: string;
  occurredAt: string;
  userId?: string;
  summary: string;
  event: AnalyticsEvent;
}
