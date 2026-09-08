import { uiCopy } from "@/config/ui-copy";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { ChoiceOptions } from "@/features/media/ChoiceOptions";
import type { QuestCardProps } from "@/features/quest/quest-card.types";

function formatRemaining(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Shared form and validation presentation; both layouts use the same controller. */
export function QuestAnswerForm({
  activeQuest,
  activeAttempt,
  answerFormRef,
  availability,
  highlightAnswerForm,
  handleSubmit,
  answer,
  setAnswer,
  isPermanentlyLocked,
  isTemporarilyLocked,
  now,
  pending = false,
  canMoveNext,
  nextIndex,
  moveTo,
  openImages,
  openVideo,
}: Pick<
  QuestCardProps,
  | "activeQuest"
  | "activeAttempt"
  | "answerFormRef"
  | "availability"
  | "highlightAnswerForm"
  | "handleSubmit"
  | "answer"
  | "setAnswer"
  | "isPermanentlyLocked"
  | "isTemporarilyLocked"
  | "now"
  | "pending"
  | "canMoveNext"
  | "nextIndex"
  | "moveTo"
  | "openImages"
  | "openVideo"
>) {
  return (
    <form
      ref={answerFormRef}
      className="answer-form"
      data-guide-highlight={highlightAnswerForm || undefined}
      onSubmit={handleSubmit}
    >
      {activeQuest.kind === "choice" ? (
        <ChoiceOptions
          questId={activeQuest.id}
          options={activeQuest.options}
          value={answer}
          disabled={
            pending ||
            isPermanentlyLocked ||
            isTemporarilyLocked ||
            activeAttempt.status === "completed"
          }
          onChange={setAnswer}
          onOpenImage={(url) => openImages([url])}
          onOpenVideo={openVideo}
        />
      ) : (
        <label className="text-answer">
          <span className="sr-only">{uiCopy.questAnswerForm.answer}</span>
          <Input
            variant="line"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={
              activeQuest.answerPlaceholder ||
              uiCopy.questAnswerForm.placeholder
            }
            autoComplete="off"
            disabled={pending || activeAttempt.status === "completed"}
          />
        </label>
      )}

      {(isPermanentlyLocked || isTemporarilyLocked) && (
        <p className="penalty-state" role="timer">
          {isPermanentlyLocked
            ? uiCopy.questAnswerForm.locked
            : uiCopy.questAnswerForm.penaltyRemaining(
                formatRemaining((activeAttempt.penaltyEndsAt ?? now) - now),
              )}
        </p>
      )}

      <div className="answer-actions">
        {activeAttempt.status !== "completed" && (
          <Button
            variant="primary"
            type="submit"
            disabled={
              pending ||
              isPermanentlyLocked ||
              isTemporarilyLocked ||
              availability.status !== "available"
            }
          >
            {uiCopy.questAnswerForm.submit}
          </Button>
        )}
        {canMoveNext && (
          <Button variant="secondary" onClick={() => moveTo(nextIndex)}>
            {uiCopy.questAnswerForm.next}
          </Button>
        )}
      </div>
    </form>
  );
}
