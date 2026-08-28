import type { FormEvent, PointerEvent, RefObject } from "react";
import { EnergyBurst } from "../../components/effects/QuestAtmosphere";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/FormControls";
import type {
  Quest,
  QuestAttempt,
  QuestAvailability,
  QuestClue,
} from "../../domain/quest/types";
import { CluePanel } from "../clues/CluePanel";
import { ChoiceOptions } from "../media/ChoiceOptions";
import { QuestContent } from "../media/QuestContent";
import type { useHorizontalSwipe } from "../../shared/gestures/useHorizontalSwipe";

// The original question-card markup is shared by both data controllers.
// This component cannot judge answers or persist player progress.
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
  openImages: (urls: readonly string[], index?: number) => void;
  openVideo: (url: string, poster?: string) => void;
  setTextClue: (clue: QuestClue) => void;
  onClueOpen?: (clue: QuestClue) => void;
}
function formatRemaining(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
export function QuestCard({
  activeQuest,
  activeAttempt,
  activeQuestionNumber,
  questCardRef,
  answerFormRef,
  swipeHandlers,
  updateQuestSpotlight,
  hideQuestSpotlight,
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
  feedback,
  feedbackTone,
  openImages,
  openVideo,
  setTextClue,
  onClueOpen,
}: QuestCardProps) {
  return (
    <article
      key={activeQuest.id}
      ref={questCardRef}
      className="quest-card"
      data-answer-state={activeAttempt.status}
      tabIndex={-1}
      aria-label={`第 ${activeQuestionNumber} 题`}
      onPointerMove={updateQuestSpotlight}
      onPointerLeave={hideQuestSpotlight}
      {...swipeHandlers}
    >
      <div className="quest-meta">
        <span>第 {activeQuestionNumber} 题</span>
        <span>{activeQuest.kind === "choice" ? "选择题" : "填空题"}</span>
      </div>
      {activeQuest.title && <h1>{activeQuest.title}</h1>}
      <QuestContent
        items={activeQuest.content}
        fallback={activeQuest.prompt}
        onOpenImages={openImages}
        onOpenVideo={openVideo}
      />

      {availability.status !== "available" && (
        <div className="availability-notice" role="status">
          {availability.status === "not-started"
            ? `开放时间：${new Date(availability.startsAt).toLocaleString()}`
            : `已于 ${new Date(availability.endedAt).toLocaleString()} 结束`}
        </div>
      )}

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

      {feedback && (
        <>
          <p
            key={feedback}
            className="feedback"
            data-tone={feedbackTone}
            role="status"
            aria-live="polite"
          >
            {feedback}
          </p>
          {feedbackTone !== "neutral" && <EnergyBurst tone={feedbackTone} />}
        </>
      )}
      {activeAttempt.status === "completed" && (
        <CluePanel
          clues={activeQuest.clues}
          onOpenText={setTextClue}
          onOpenImages={openImages}
          onOpenVideo={openVideo}
          onClueOpen={onClueOpen}
        />
      )}
      <div className="quest-card-chrome" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
    </article>
  );
}

export function QuestAnswerGuide({
  dismissAnswerGuide,
}: {
  dismissAnswerGuide: (locate: boolean) => void;
}) {
  return (
    <aside className="answer-guide" aria-label="答题引导">
      <div className="answer-guide__marker" aria-hidden="true">
        01
      </div>
      <div className="answer-guide__copy">
        <strong>答案在题目下方</strong>
        <p>向下阅读题目，在卡片底部填写或选择答案；完成后解锁下一题。</p>
      </div>
      <div className="answer-guide__actions">
        <Button
          variant="ghost"
          size="small"
          onClick={() => dismissAnswerGuide(false)}
        >
          知道了
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={() => dismissAnswerGuide(true)}
        >
          定位答题区
        </Button>
      </div>
    </aside>
  );
}
