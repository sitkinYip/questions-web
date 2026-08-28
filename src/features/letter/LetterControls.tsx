import type { LetterSwipeAxis } from "./letterPagination";
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
          <p className="eyebrow">故事仍在继续</p>
          <h2>阅读手记</h2>
          <p>
            {isFinished
              ? "慢慢读，有些答案藏在字里行间。"
              : "字句正在浮现，也可以直接展开全文。"}
          </p>
          <span>
            第 {pageIndex + 1} 页 · 共 {pageCount} 页
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
              !isFinished ? "全文显示后可翻页" : turning ? "翻页中" : undefined
            }
            onClick={() => turnPage("previous")}
          >
            上一页
          </button>
          <span aria-label={`第 ${pageIndex + 1} 页，共 ${pageCount} 页`}>
            {pageIndex + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={!canTurnPages || pageIndex === pageCount - 1}
            title={
              !isFinished ? "全文显示后可翻页" : turning ? "翻页中" : undefined
            }
            onClick={() => turnPage("next")}
          >
            下一页
          </button>
        </div>
      )}
      {pageCount > 1 && (
        <span id="letter-page-gesture-instructions" className="sr-only">
          {isFinished
            ? swipeAxis === "horizontal"
              ? "可左右滑动翻页。"
              : "可上下滑动翻页。"
            : "打字完成或显示全文后可以翻页。"}
        </span>
      )}
      <div className="letter-actions">
        {!isFinished && (
          <button type="button" onClick={skipTyping}>
            显示全文
          </button>
        )}
        <button type="button" onClick={closeLetter}>
          收起信件
        </button>
      </div>
      {desktop && returnTo && (
        <a className="letter-desktop-return" href={returnTo}>
          <ArrowLeftIcon aria-hidden="true" />
          返回冒险
        </a>
      )}
      {desktop && pageCount > 1 && (
        <p className="letter-desktop-keyboard">全文显示后，可用 ← → 翻页</p>
      )}
    </footer>
  );
}
