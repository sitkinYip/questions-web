import { uiCopy } from "@/config/ui-copy";
import type { LetterSwipeAxis } from "@/features/letter/letterPagination";
import { BookOpenTextIcon, ArrowLeftIcon } from "@phosphor-icons/react";

interface LetterControlsProps {
  desktop: boolean;
  pageCount: number;
  pageIndex: number;
  canTurnPages: boolean;
  isFinished: boolean;
  turning: boolean;
  swipeAxis: LetterSwipeAxis;
  turnPage: (direction: "previous" | "next") => void;
  skipTyping: () => void;
  closeLetter: () => void;
  returnTo: string | null;
}

export function LetterControls({
  desktop,
  pageCount,
  pageIndex,
  canTurnPages,
  isFinished,
  turning,
  swipeAxis,
  turnPage,
  skipTyping,
  closeLetter,
  returnTo,
}: LetterControlsProps) {
  return (
    <footer className="letter-controls">
      {desktop && (
        <div className="letter-desktop-guide">
          <BookOpenTextIcon weight="thin" aria-hidden="true" />
          <p className="eyebrow">{uiCopy.letterControls.continuing}</p>
          <h2>{uiCopy.letterControls.title}</h2>
          <p>
            {isFinished
              ? uiCopy.letterControls.readingHint
              : uiCopy.letterControls.typingHint}
          </p>
          <span>
            {uiCopy.letterControls.pageSummary(pageIndex + 1, pageCount)}
          </span>
        </div>
      )}
      {pageCount > 1 && (
        <div
          className="letter-page-navigation"
          data-locked={canTurnPages ? "false" : "true"}
        >
          <button
            type="button"
            disabled={!canTurnPages || pageIndex === 0}
            title={
              !isFinished
                ? uiCopy.letterControls.disabled
                : turning
                  ? uiCopy.letterControls.turning
                  : undefined
            }
            onClick={() => turnPage("previous")}
          >
            {uiCopy.letterControls.previous}
          </button>
          <span
            aria-label={uiCopy.letterControls.pageLabel(
              pageIndex + 1,
              pageCount,
            )}
          >
            {pageIndex + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={!canTurnPages || pageIndex === pageCount - 1}
            title={
              !isFinished
                ? uiCopy.letterControls.disabled
                : turning
                  ? uiCopy.letterControls.turning
                  : undefined
            }
            onClick={() => turnPage("next")}
          >
            {uiCopy.letterControls.next}
          </button>
        </div>
      )}
      {pageCount > 1 && (
        <span id="letter-page-gesture-instructions" className="sr-only">
          {isFinished
            ? swipeAxis === "horizontal"
              ? uiCopy.letterControls.horizontalHint
              : uiCopy.letterControls.verticalHint
            : uiCopy.letterControls.paginationHint}
        </span>
      )}
      <div className="letter-actions">
        {!isFinished && (
          <button type="button" onClick={skipTyping}>
            {uiCopy.letterControls.showAll}
          </button>
        )}
        <button type="button" onClick={closeLetter}>
          {uiCopy.letterControls.close}
        </button>
      </div>
      {desktop && returnTo && (
        <a className="letter-desktop-return" href={returnTo}>
          <ArrowLeftIcon aria-hidden="true" />
          {uiCopy.letterControls.back}
        </a>
      )}
      {desktop && pageCount > 1 && (
        <p className="letter-desktop-keyboard">
          {uiCopy.letterControls.keyboardHint}
        </p>
      )}
    </footer>
  );
}
