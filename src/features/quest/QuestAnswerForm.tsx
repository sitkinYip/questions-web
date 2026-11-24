import { useEffect, useId, useRef, useState } from "react";
import { ArrowRightIcon, CaretUpIcon, XIcon } from "@phosphor-icons/react";
import { uiCopy } from "@/config/ui-copy";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { ChoiceOptions } from "@/features/media/ChoiceOptions";
import type { QuestCardProps } from "@/features/quest/quest-card.types";

function formatPenaltyRemaining(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function QuestPenaltyNotice({
  isPermanentlyLocked,
  isTemporarilyLocked,
  penaltyEndsAt,
  now,
}: {
  isPermanentlyLocked: boolean;
  isTemporarilyLocked: boolean;
  penaltyEndsAt: number | null;
  now: number;
}) {
  if (!isPermanentlyLocked && !isTemporarilyLocked) return null;
  return (
    <p className="penalty-state" role="timer">
      {isPermanentlyLocked
        ? uiCopy.questAnswerForm.locked
        : uiCopy.questAnswerForm.penaltyRemaining(
            formatPenaltyRemaining((penaltyEndsAt ?? now) - now),
          )}
    </p>
  );
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
  hidePenalty = false,
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
> & { hidePenalty?: boolean }) {
  const submitDisabled =
    pending ||
    isPermanentlyLocked ||
    isTemporarilyLocked ||
    availability.status !== "available";
  const isCompleted = activeAttempt.status === "completed";
  const isChoice = activeQuest.kind === "choice";
  const choiceReadOnly =
    pending ||
    isPermanentlyLocked ||
    isTemporarilyLocked ||
    isCompleted ||
    availability.status !== "available";

  const [openQuestId, setOpenQuestId] = useState<string | null>(null);
  const [popoverLayout, setPopoverLayout] = useState<{
    direction: "up" | "down";
    maxHeight?: number;
  }>({ direction: "up" });
  const choiceDockRef = useRef<HTMLDivElement | null>(null);
  const choiceTriggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverId = useId();

  // 已作答/冷却/锁定态依然允许点击展开只读查看全部选项，仅在提交请求期间禁止切换展开
  const choiceOpen = isChoice && !pending && openQuestId === activeQuest.id;

  const toggleChoicePopover = () => {
    if (choiceOpen) {
      setOpenQuestId(null);
      return;
    }
    const dock = choiceDockRef.current;
    if (dock && typeof window !== "undefined") {
      const rect = dock.getBoundingClientRect();
      const spaceBelow = Math.floor(window.innerHeight - rect.bottom - 20);
      const spaceAbove = Math.floor(rect.top - 20);
      const inInlineDock = Boolean(dock.closest(".quest-inline-dock"));
      // 桌面内联底栏优先向可用空间充裕的一侧展开；移动端固定底栏向上展开并尽可能留足高度展示全量选项
      if (
        inInlineDock &&
        (spaceBelow >= 280 || (spaceBelow >= 200 && spaceBelow >= spaceAbove))
      ) {
        setPopoverLayout({
          direction: "down",
          maxHeight: Math.max(160, Math.min(560, spaceBelow)),
        });
      } else {
        setPopoverLayout({
          direction: "up",
          maxHeight: Math.max(160, Math.min(620, spaceAbove)),
        });
      }
    } else {
      setPopoverLayout({ direction: "up" });
    }
    setOpenQuestId(activeQuest.id);
  };
  const selectedOption = isChoice
    ? activeQuest.options.find((option) => option.key === answer)
    : undefined;
  const selectedLabel = selectedOption
    ? selectedOption.text || uiCopy.choiceOptions.option(selectedOption.key)
    : "";

  useEffect(() => {
    if (!choiceOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      if (
        choiceDockRef.current?.contains(target) ||
        target.closest('.media-viewer-backdrop, [role="dialog"]')
      ) {
        return;
      }
      setOpenQuestId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      setOpenQuestId(null);
      choiceTriggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [choiceOpen]);

  const submitControl = !isCompleted ? (
    <button
      type="submit"
      className="answer-send-btn"
      aria-label={uiCopy.questAnswerForm.submit}
      disabled={submitDisabled}
    >
      <ArrowRightIcon size={22} weight="bold" aria-hidden="true" />
    </button>
  ) : (
    canMoveNext && (
      <Button
        variant="primary"
        className="answer-next-btn"
        onClick={() => moveTo(nextIndex)}
      >
        <span>{uiCopy.questAnswerForm.next}</span>
        <ArrowRightIcon size={16} weight="bold" aria-hidden="true" />
      </Button>
    )
  );

  return (
    <form
      ref={answerFormRef}
      className={`answer-form${isChoice ? " answer-form--choice" : " answer-form--text"}`}
      data-guide-highlight={highlightAnswerForm || undefined}
      onSubmit={(event) => {
        setOpenQuestId(null);
        handleSubmit(event);
      }}
    >
      {isChoice ? (
        <div
          ref={choiceDockRef}
          className="choice-dock"
          data-open={choiceOpen ? "true" : undefined}
        >
          {choiceOpen && (
            <div
              id={popoverId}
              className="choice-dock-popover"
              data-direction={popoverLayout.direction}
              style={
                popoverLayout.maxHeight
                  ? { maxHeight: `${popoverLayout.maxHeight}px` }
                  : undefined
              }
              role="region"
              aria-label={uiCopy.choiceOptions.legend}
            >
              <div className="choice-dock-popover__head">
                <span className="choice-dock-popover__hint">
                  {isCompleted
                    ? "已作答 · 仅查看选项"
                    : choiceReadOnly
                      ? "当前仅可查看选项"
                      : selectedOption
                        ? `已选 ${selectedOption.key} · 点击选项可更换`
                        : "请选择一个选项"}
                </span>
                <button
                  type="button"
                  className="choice-dock-popover__close"
                  aria-label="收起选项"
                  onClick={() => {
                    setOpenQuestId(null);
                    choiceTriggerRef.current?.focus();
                  }}
                >
                  <XIcon size={15} weight="bold" aria-hidden="true" />
                </button>
              </div>
              <div className="choice-dock-popover__body">
                <ChoiceOptions
                  questId={activeQuest.id}
                  options={activeQuest.options}
                  value={answer}
                  disabled={choiceReadOnly}
                  onChange={setAnswer}
                  onSelect={() => setOpenQuestId(null)}
                  onOpenImage={(url) => openImages([url])}
                  onOpenVideo={openVideo}
                />
              </div>
            </div>
          )}

          <div className="answer-input-bar answer-input-bar--choice">
            <button
              ref={choiceTriggerRef}
              type="button"
              className="choice-dock-trigger"
              data-selected={selectedOption ? "true" : undefined}
              data-readonly={choiceReadOnly ? "true" : undefined}
              aria-expanded={choiceOpen}
              aria-controls={choiceOpen ? popoverId : undefined}
              aria-label={
                selectedOption
                  ? choiceReadOnly
                    ? `已作答 ${selectedOption.key} ${selectedLabel}，点击查看全部选项`
                    : `已选择 ${selectedOption.key} ${selectedLabel}，点击展开选项`
                  : choiceReadOnly
                    ? "查看全部选项"
                    : "选择答案"
              }
              disabled={pending}
              onClick={toggleChoicePopover}
            >
              {selectedOption ? (
                <span className="choice-dock-trigger__value">
                  <span className="choice-dock-trigger__key">
                    {selectedOption.key}
                  </span>
                  <span className="choice-dock-trigger__label">
                    {selectedLabel}
                  </span>
                </span>
              ) : (
                <span className="choice-dock-trigger__placeholder">
                  {choiceReadOnly ? "查看选项" : "选择答案"}
                </span>
              )}
              {!pending && (
                <CaretUpIcon
                  size={16}
                  weight="bold"
                  className="choice-dock-trigger__caret"
                  aria-hidden="true"
                />
              )}
            </button>
            {submitControl}
          </div>
        </div>
      ) : (
        <div className="answer-input-bar">
          <label className="text-answer">
            <span className="sr-only">{uiCopy.questAnswerForm.answer}</span>
            <Input
              className="answer-input-bar__field"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={
                activeQuest.answerPlaceholder ||
                uiCopy.questAnswerForm.placeholder
              }
              autoComplete="off"
              disabled={pending || isCompleted}
            />
          </label>
          {submitControl}
        </div>
      )}

      {!hidePenalty && (
        <QuestPenaltyNotice
          isPermanentlyLocked={isPermanentlyLocked}
          isTemporarilyLocked={isTemporarilyLocked}
          penaltyEndsAt={activeAttempt.penaltyEndsAt}
          now={now}
        />
      )}
    </form>
  );
}
