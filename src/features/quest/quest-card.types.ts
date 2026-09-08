import type { FormEvent, PointerEvent, RefObject } from "react";
import type {
  Quest,
  QuestAttempt,
  QuestAvailability,
  QuestClue,
} from "@/domain/quest/types";
import type { useHorizontalSwipe } from "@/shared/gestures/useHorizontalSwipe";

export interface QuestCardProps {
  activeQuest: Pick<
    Quest,
    | "id"
    | "kind"
    | "title"
    | "prompt"
    | "content"
    | "options"
    | "answerPlaceholder"
    | "clues"
  >;
  activeAttempt: Pick<QuestAttempt, "status" | "penaltyEndsAt">;
  activeQuestionNumber: number;
  questCardRef: RefObject<HTMLElement | null>;
  answerFormRef: RefObject<HTMLFormElement | null>;
  swipeHandlers: ReturnType<typeof useHorizontalSwipe>;
  updateQuestSpotlight: (event: PointerEvent<HTMLElement>) => void;
  hideQuestSpotlight: (event: PointerEvent<HTMLElement>) => void;
  availability: QuestAvailability;
  highlightAnswerForm: boolean;
  handleSubmit: (event: FormEvent) => void;
  answer: string;
  setAnswer: (value: string) => void;
  isPermanentlyLocked: boolean;
  isTemporarilyLocked: boolean;
  now: number;
  pending?: boolean;
  canMoveNext: boolean;
  nextIndex: number;
  moveTo: (index: number) => void;
  feedback: string;
  feedbackTone: "neutral" | "success" | "danger";
  feedbackKey?: number;
  feedbackAutoDismiss?: boolean;
  attentionClueIds?: ReadonlySet<string>;
  openImages: (urls: readonly string[], index?: number) => void;
  openVideo: (url: string, poster?: string) => void;
  setTextClue: (clue: QuestClue) => void;
  onClueOpen?: (clue: QuestClue) => void;
}
