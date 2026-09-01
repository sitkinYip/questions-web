import { Fragment } from "react";
import { EnergyBurst } from "../../components/effects/QuestAtmosphere";
import { Button } from "../../components/ui/Button";
import { CluePanel } from "../clues/CluePanel";
import { QuestContent } from "../media/QuestContent";
import { QuestAnswerForm } from "./QuestAnswerForm";
import { AnswerFeedback } from "./AnswerFeedback";
import type { QuestCardProps } from "./quest-card.types";
export type { QuestCardProps } from "./quest-card.types";

// Mobile/legacy markup stays unchanged; desktop owns a separate composition.
export function QuestCard(props: QuestCardProps) {
  const {
    activeQuest,
    activeAttempt,
    activeQuestionNumber,
    questCardRef,
    swipeHandlers,
    updateQuestSpotlight,
    hideQuestSpotlight,
    availability,
    feedback,
    feedbackTone,
    feedbackKey,
    feedbackAutoDismiss,
    attentionClueIds,
    openImages,
    openVideo,
    setTextClue,
    onClueOpen,
  } = props;
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

      <QuestAnswerForm {...props} />

      {feedback && (
        <Fragment key={`${feedback}-${feedbackKey ?? 0}`}>
          <AnswerFeedback
            message={feedback}
            tone={feedbackTone}
            autoDismiss={feedbackAutoDismiss}
          />
          {feedbackTone !== "neutral" && <EnergyBurst tone={feedbackTone} />}
        </Fragment>
      )}
      {activeAttempt.status === "completed" && (
        <CluePanel
          clues={activeQuest.clues}
          onOpenText={setTextClue}
          onOpenImages={openImages}
          onOpenVideo={openVideo}
          onClueOpen={onClueOpen}
          attentionClueIds={attentionClueIds}
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
