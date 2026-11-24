import { uiCopy } from "@/config/ui-copy";
import { Fragment, useState } from "react";
import { LightbulbFilamentIcon } from "@phosphor-icons/react";
import { EnergyBurst } from "@/components/effects/QuestAtmosphere";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { overlayPriority } from "@/components/ui/overlay-context";
import { CluePanel } from "@/features/clues/CluePanel";
import { RichContent } from "@/features/content/RichContent";
import { QuestContent } from "@/features/media/QuestContent";
import {
  QuestAnswerForm,
  QuestPenaltyNotice,
} from "@/features/quest/QuestAnswerForm";
import { AnswerFeedback } from "@/features/quest/AnswerFeedback";
import type { QuestCardProps } from "@/features/quest/quest-card.types";
export type { QuestCardProps } from "@/features/quest/quest-card.types";

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
    isPermanentlyLocked,
    isTemporarilyLocked,
    now,
    attentionClueIds,
    openImages,
    openVideo,
    setTextClue,
    onClueOpen,
  } = props;
  const [hintOpenForQuestId, setHintOpenForQuestId] = useState<string | null>(
    null,
  );
  const hints = activeQuest.content
    .map((item) => item.hint?.trim())
    .filter((hint): hint is string => Boolean(hint));
  const hasHints = hints.length > 0;
  const hintOpen = hasHints && hintOpenForQuestId === activeQuest.id;

  return (
    <>
      <article
        key={activeQuest.id}
        ref={questCardRef}
        className="quest-card"
        data-answer-state={activeAttempt.status}
        data-feedback-tone={feedback ? feedbackTone : undefined}
        tabIndex={-1}
        aria-label={uiCopy.questCard.questionNumber(activeQuestionNumber)}
        onPointerMove={updateQuestSpotlight}
        onPointerLeave={hideQuestSpotlight}
        {...swipeHandlers}
      >
        <div className="quest-meta">
          <span className="quest-meta__num">
            {uiCopy.questCard.questionNumber(activeQuestionNumber)}
          </span>
          {hasHints && (
            <button
              type="button"
              className="quest-clue-btn"
              aria-label={uiCopy.questContent.hint}
              aria-haspopup="dialog"
              aria-expanded={hintOpen}
              onClick={() => setHintOpenForQuestId(activeQuest.id)}
            >
              <LightbulbFilamentIcon
                size={19}
                weight={hintOpen ? "fill" : "regular"}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
        {activeQuest.title && <h1>{activeQuest.title}</h1>}
        <QuestContent
          items={activeQuest.content}
          fallback={activeQuest.prompt}
          hideHints
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

        <QuestPenaltyNotice
          isPermanentlyLocked={isPermanentlyLocked}
          isTemporarilyLocked={isTemporarilyLocked}
          penaltyEndsAt={activeAttempt.penaltyEndsAt}
          now={now}
        />

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

        {hasHints && (
          <Sheet
            overlayId={`quest-hint-${activeQuest.id}`}
            priority={overlayPriority.content}
            open={hintOpen}
            onOpenChange={(nextOpen) =>
              setHintOpenForQuestId(nextOpen ? activeQuest.id : null)
            }
            title={uiCopy.questContent.hint}
            side="bottom"
            density="compact"
            className="quest-hint-sheet"
          >
            <div className="quest-hint-sheet__list">
              {hints.map((hint, index) => (
                <div className="quest-hint-sheet__item" key={index}>
                  <RichContent source={hint} />
                </div>
              ))}
            </div>
          </Sheet>
        )}

        <div className="quest-card-chrome" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </article>

      <div className="quest-input-dock">
        <QuestAnswerForm {...props} hidePenalty />
      </div>
    </>
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
