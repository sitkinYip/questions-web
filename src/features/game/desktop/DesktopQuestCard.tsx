import { useState } from "react";
import { LightbulbFilamentIcon } from "@phosphor-icons/react";
import { uiCopy } from "@/config/ui-copy";
import { EnergyBurst } from "@/components/effects/QuestAtmosphere";
import { Sheet } from "@/components/ui/Sheet";
import { overlayPriority } from "@/components/ui/overlay-context";
import { RichContent } from "@/features/content/RichContent";
import { QuestContent } from "@/features/media/QuestContent";
import {
  QuestAnswerForm,
  QuestPenaltyNotice,
} from "@/features/quest/QuestAnswerForm";
import { AnswerFeedback } from "@/features/quest/AnswerFeedback";
import type { QuestCardProps } from "@/features/quest/quest-card.types";

/** 桌面端题目阅读卡 + 卡片下方独立输入栏，与预览结构保持一致。 */
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
    isPermanentlyLocked,
    isTemporarilyLocked,
    now,
    swipeHandlers,
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
    <div className="desktop-question-column">
      <article
        ref={questCardRef}
        className="quest-card desktop-question"
        data-answer-state={activeAttempt.status}
        data-feedback-tone={feedback ? feedbackTone : undefined}
        tabIndex={-1}
        aria-label={uiCopy.desktopQuestCard.questionNumber(
          activeQuestionNumber,
        )}
        {...swipeHandlers}
      >
        <div
          className="desktop-question__reading"
          tabIndex={0}
          aria-label={uiCopy.desktopQuestCard.contentLabel}
        >
          <div className="quest-meta">
            <span className="quest-meta__num">
              {uiCopy.desktopQuestCard.questionNumber(activeQuestionNumber)}
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
          <QuestPenaltyNotice
            isPermanentlyLocked={isPermanentlyLocked}
            isTemporarilyLocked={isTemporarilyLocked}
            penaltyEndsAt={activeAttempt.penaltyEndsAt}
            now={now}
          />
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

        {hasHints && (
          <Sheet
            overlayId={`quest-hint-desktop-${activeQuest.id}`}
            priority={overlayPriority.content}
            open={hintOpen}
            onOpenChange={(nextOpen) =>
              setHintOpenForQuestId(nextOpen ? activeQuest.id : null)
            }
            title={uiCopy.questContent.hint}
            side="right"
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

      <div className="quest-inline-dock">
        <QuestAnswerForm {...props} hidePenalty />
      </div>
    </div>
  );
}
