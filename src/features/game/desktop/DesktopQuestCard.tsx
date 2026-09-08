import { uiCopy } from "@/config/ui-copy";
import { EnergyBurst } from "@/components/effects/QuestAtmosphere";
import { QuestContent } from "@/features/media/QuestContent";
import { QuestAnswerForm } from "@/features/quest/QuestAnswerForm";
import { AnswerFeedback } from "@/features/quest/AnswerFeedback";
import type { QuestCardProps } from "@/features/quest/quest-card.types";

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
      aria-label={uiCopy.desktopQuestCard.questionNumber(activeQuestionNumber)}
      {...swipeHandlers}
    >
      <div
        className="desktop-question__reading"
        tabIndex={0}
        aria-label={uiCopy.desktopQuestCard.contentLabel}
      >
        <div className="quest-meta">
          <span>
            {uiCopy.desktopQuestCard.questionNumber(activeQuestionNumber)}
          </span>
          <span>
            {activeQuest.kind === "choice"
              ? uiCopy.desktopQuestCard.choice
              : uiCopy.desktopQuestCard.text}
          </span>
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
              ? uiCopy.desktopQuestCard.startsAt(
                  new Date(availability.startsAt).toLocaleString(),
                )
              : uiCopy.desktopQuestCard.endedAt(
                  new Date(availability.endedAt).toLocaleString(),
                )}
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
