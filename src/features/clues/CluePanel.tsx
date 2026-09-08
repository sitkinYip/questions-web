import { uiCopy } from "@/config/ui-copy";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  EnvelopeSimpleOpenIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { QuestClue } from "@/domain/quest/types";
import { RichContent } from "@/features/content/RichContent";

interface CluePanelProps {
  clues: readonly QuestClue[];
  onOpenText: (clue: QuestClue) => void;
  onOpenImages: (urls: readonly string[], index?: number) => void;
  onOpenVideo: (url: string) => void;
  onClueOpen?: (clue: QuestClue) => void;
  attentionClueIds?: ReadonlySet<string>;
}

const clueLabels = {
  text: uiCopy.cluePanel.text,
  image: uiCopy.cluePanel.image,
  video: uiCopy.cluePanel.video,
  link: uiCopy.cluePanel.link,
  letter: uiCopy.cluePanel.letter,
  bless: uiCopy.cluePanel.bless,
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
  attentionClueIds,
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
          <p className="eyebrow">{uiCopy.cluePanel.eyebrow}</p>
          <h2 id="clue-panel-title">{uiCopy.cluePanel.title}</h2>
        </div>
        <div
          className="clue-panel-count"
          aria-label={uiCopy.cluePanel.unlockedCount(clues.length)}
        >
          <strong>{String(clues.length).padStart(2, "0")}</strong>
          <span>{uiCopy.cluePanel.unlockedSuffix}</span>
        </div>
      </div>
      <div className="clue-list">
        {clues.map((clue, index) => {
          const label = clue.title || clueLabels[clue.kind];
          const isNarrative = clue.kind === "letter" || clue.kind === "bless";
          const needsAttention = Boolean(
            isNarrative && attentionClueIds?.has(clue.id),
          );
          const archiveNumber = String(index + 1).padStart(2, "0");
          const preview = clue.content ? (
            <RichContent source={clue.content} className="clue-preview" />
          ) : (
            <p className="clue-preview">{uiCopy.cluePanel.preview}</p>
          );
          const lead = (
            <span className="clue-index" aria-hidden="true">
              <strong>{archiveNumber}</strong>
              <span>{clue.kind}</span>
            </span>
          );
          const content = (
            <div className="clue-card-body">
              <span className="clue-card-status">
                {needsAttention
                  ? clue.kind === "letter"
                    ? uiCopy.cluePanel.letterWaiting
                    : uiCopy.cluePanel.blessingWaiting
                  : isNarrative
                    ? uiCopy.cluePanel.narrativeUnlocked
                    : uiCopy.cluePanel.verified}
              </span>
              <strong>{label}</strong>
              {preview}
            </div>
          );
          const action = (
            <span className="clue-card-action" aria-hidden="true">
              <i />
              {clue.kind === "letter" ? (
                <EnvelopeSimpleOpenIcon weight="duotone" />
              ) : clue.kind === "bless" ? (
                <SparkleIcon weight="duotone" />
              ) : clue.kind === "link" ? (
                <ArrowUpRightIcon />
              ) : (
                <ArrowRightIcon />
              )}
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
                data-attention={needsAttention || undefined}
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
                data-attention={needsAttention || undefined}
                onClick={() => onClueOpen?.(clue)}
              >
                {body}
              </a>
            );
          }

          if (isNarrative && clue.href) {
            const returnTo = `${window.location.pathname}${window.location.search}`;
            return (
              <Link
                className="clue-card clue-card-letter"
                key={clue.id}
                to={withReturnTo(clue.href, returnTo)}
                data-kind={clue.kind}
                data-attention={needsAttention || undefined}
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
              data-attention={needsAttention || undefined}
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
