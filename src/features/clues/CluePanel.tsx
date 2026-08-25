import { Link } from "react-router-dom";
import type { QuestClue } from "../../domain/quest/types";
import { RichContent } from "../content/RichContent";

interface CluePanelProps {
  clues: readonly QuestClue[];
  onOpenText: (clue: QuestClue) => void;
  onOpenImages: (urls: readonly string[], index?: number) => void;
  onOpenVideo: (url: string) => void;
  onClueOpen?: (clue: QuestClue) => void;
}

const clueLabels = {
  text: "古老密卷",
  image: "神谕影像",
  video: "时空回溯",
  link: "位面传送",
  letter: "星海情笺",
} as const;

function withReturnTo(href: string, returnTo: string) {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

export function CluePanel({
  clues,
  onOpenText,
  onOpenImages,
  onOpenVideo,
  onClueOpen,
}: CluePanelProps) {
  if (clues.length === 0) return null;

  return (
    <section className="clue-panel" aria-labelledby="clue-panel-title">
      <div className="clue-panel-atmosphere" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="clue-panel-heading">
        <div>
          <p className="eyebrow">Unlocked archive</p>
          <h2 id="clue-panel-title">通关线索</h2>
        </div>
        <div
          className="clue-panel-count"
          aria-label={`已解锁 ${clues.length} 件线索`}
        >
          <strong>{String(clues.length).padStart(2, "0")}</strong>
          <span>件已解锁</span>
        </div>
      </div>
      <div className="clue-list">
        {clues.map((clue, index) => {
          const label = clue.title || clueLabels[clue.kind];
          const archiveNumber = String(index + 1).padStart(2, "0");
          const preview = clue.content ? (
            <RichContent source={clue.content} className="clue-preview" />
          ) : (
            <p className="clue-preview">点击查看已解锁内容</p>
          );
          const lead = (
            <span className="clue-index" aria-hidden="true">
              <strong>{archiveNumber}</strong>
              <span>{clue.kind}</span>
            </span>
          );
          const content = (
            <div className="clue-card-body">
              <span className="clue-card-status">Archive verified</span>
              <strong>{label}</strong>
              {preview}
            </div>
          );
          const action = (
            <span className="clue-card-action" aria-hidden="true">
              <i />
              <span>{clue.kind === "link" ? "↗" : "→"}</span>
            </span>
          );

          if (clue.kind === "link" && clue.href) {
            const body = (
              <>
                {lead}
                {content}
                {action}
              </>
            );
            return clue.linkTarget === "internal" ? (
              <Link
                className="clue-card"
                key={clue.id}
                to={clue.href}
                data-kind={clue.kind}
                onClick={() => onClueOpen?.(clue)}
              >
                {body}
              </Link>
            ) : (
              <a
                className="clue-card"
                key={clue.id}
                href={clue.href}
                target="_blank"
                rel="noopener noreferrer"
                data-kind={clue.kind}
                onClick={() => onClueOpen?.(clue)}
              >
                {body}
              </a>
            );
          }

          if (clue.kind === "letter" && clue.href) {
            const returnTo = `${window.location.pathname}${window.location.search}`;
            return (
              <Link
                className="clue-card clue-card-letter"
                key={clue.id}
                to={withReturnTo(clue.href, returnTo)}
                data-kind={clue.kind}
                onClick={() => onClueOpen?.(clue)}
              >
                {lead}
                {content}
                {action}
              </Link>
            );
          }

          const open = () => {
            onClueOpen?.(clue);
            if (clue.kind === "text") onOpenText(clue);
            if (clue.kind === "image") onOpenImages(clue.imageUrls);
            if (clue.kind === "video" && clue.url) onOpenVideo(clue.url);
          };
          return (
            <button
              className="clue-card"
              type="button"
              key={clue.id}
              data-kind={clue.kind}
              onClick={open}
            >
              {lead}
              {content}
              {action}
            </button>
          );
        })}
      </div>
    </section>
  );
}
