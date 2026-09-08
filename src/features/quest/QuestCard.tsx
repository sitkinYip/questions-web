import { uiCopy } from "@/config/ui-copy";
import { Fragment } from "react";
import { EnergyBurst } from "@/components/effects/QuestAtmosphere";
import { Button } from "@/components/ui/Button";
import { CluePanel } from "@/features/clues/CluePanel";
import { QuestContent } from "@/features/media/QuestContent";
import { QuestAnswerForm } from "@/features/quest/QuestAnswerForm";
import { AnswerFeedback } from "@/features/quest/AnswerFeedback";
import type { QuestCardProps } from "@/features/quest/quest-card.types";
export type { QuestCardProps } from "@/features/quest/quest-card.types";

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
      aria-label={uiCopy.questCard.questionNumber(activeQuestionNumber)}
      onPointerMove={updateQuestSpotlight}
      onPointerLeave={hideQuestSpotlight}
      {...swipeHandlers}
    >
      <div className="quest-meta">
        <span>{uiCopy.questCard.questionNumber(activeQuestionNumber)}</span>
        <span>
          {activeQuest.kind === "choice"
            ? uiCopy.questCard.choice
            : uiCopy.questCard.text}
        </span>
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
            ? uiCopy.questCard.startsAt(
                new Date(availability.startsAt).toLocaleString(),
              )
            : uiCopy.questCard.endedAt(
                new Date(availability.endedAt).toLocaleString(),
              )}
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
    <aside className="answer-guide" aria-label={uiCopy.questCard.guideLabel}>
      <div className="answer-guide__marker" aria-hidden="true">
        01
      </div>
      <div className="answer-guide__copy">
        <strong>{uiCopy.questCard.guideTitle}</strong>
        <p>{uiCopy.questCard.guideDescription}</p>
      </div>
      <div className="answer-guide__actions">
        <Button
          variant="ghost"
          size="small"
          onClick={() => dismissAnswerGuide(false)}
        >
          {uiCopy.questCard.dismissGuide}
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={() => dismissAnswerGuide(true)}
        >
          {uiCopy.questCard.locateAnswer}
        </Button>
      </div>
    </aside>
  );
}
