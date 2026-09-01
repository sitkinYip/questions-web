import { EnergyBurst } from "../../../components/effects/QuestAtmosphere";
import { QuestContent } from "../../media/QuestContent";
import { QuestAnswerForm } from "../../quest/QuestAnswerForm";
import { AnswerFeedback } from "../../quest/AnswerFeedback";
import type { QuestCardProps } from "../../quest/quest-card.types";

/** Desktop reading pane and persistent answer area, with no judgement/persistence logic. */
export function DesktopQuestCard(props: QuestCardProps) {
  const {
    activeQuest,
    activeAttempt,
    activeQuestionNumber,
    questCardRef,
    availability,
    feedback,
    feedbackTone,
    feedbackKey,
    feedbackAutoDismiss,
    swipeHandlers,
  } = props;
  return (
    <article
      ref={questCardRef}
      className="quest-card desktop-question"
      data-answer-state={activeAttempt.status}
      tabIndex={-1}
      aria-label={`第 ${activeQuestionNumber} 题`}
      {...swipeHandlers}
    >
      <div
        className="desktop-question__reading"
        tabIndex={0}
        aria-label="题目内容"
      >
        <div className="quest-meta">
          <span>第 {activeQuestionNumber} 题</span>
          <span>{activeQuest.kind === "choice" ? "选择题" : "填空题"}</span>
        </div>
        {activeQuest.title && <h1>{activeQuest.title}</h1>}
        <QuestContent
          items={activeQuest.content}
          fallback={activeQuest.prompt}
          onOpenImages={props.openImages}
          onOpenVideo={props.openVideo}
        />
        {availability.status !== "available" && (
          <div className="availability-notice" role="status">
            {availability.status === "not-started"
              ? `开放时间：${new Date(availability.startsAt).toLocaleString()}`
              : `已于 ${new Date(availability.endedAt).toLocaleString()} 结束`}
          </div>
        )}
      </div>
      <div className="desktop-question__answer">
        <QuestAnswerForm {...props} />
        {feedback && (
          <AnswerFeedback
            key={`${feedback}-${feedbackKey ?? 0}`}
            message={feedback}
            tone={feedbackTone}
            autoDismiss={feedbackAutoDismiss}
          />
        )}
      </div>
      {feedback && feedbackTone !== "neutral" && (
        <EnergyBurst tone={feedbackTone} />
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
