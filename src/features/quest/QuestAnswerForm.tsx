import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/FormControls";
import { ChoiceOptions } from "../media/ChoiceOptions";
import type { QuestCardProps } from "./quest-card.types";

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
          <span className="sr-only">答案</span>
          <Input
            variant="line"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={activeQuest.answerPlaceholder || "输入你的答案"}
            autoComplete="off"
            disabled={pending || activeAttempt.status === "completed"}
          />
        </label>
      )}

      {(isPermanentlyLocked || isTemporarilyLocked) && (
        <p className="penalty-state" role="timer">
          {isPermanentlyLocked
            ? "此题已永久锁定"
            : `距离再次尝试还有 ${formatRemaining((activeAttempt.penaltyEndsAt ?? now) - now)}`}
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
            提交答案
          </Button>
        )}
        {canMoveNext && (
          <Button variant="secondary" onClick={() => moveTo(nextIndex)}>
            前往下一题
          </Button>
        )}
      </div>
    </form>
  );
}
