import { uiCopy } from "@/config/ui-copy";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  EnvelopeSimpleOpenIcon,
  FileTextIcon,
  ImageIcon,
  LinkSimpleIcon,
  PlayCircleIcon,
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

function ClueKindIcon({ kind }: { kind: QuestClue["kind"] }) {
  switch (kind) {
    case "video":
      return <PlayCircleIcon size={20} weight="duotone" />;
    case "image":
      return <ImageIcon size={20} weight="duotone" />;
    case "link":
      return <LinkSimpleIcon size={20} weight="duotone" />;
    case "letter":
      return <EnvelopeSimpleOpenIcon size={20} weight="duotone" />;
    case "bless":
      return <SparkleIcon size={20} weight="duotone" />;
    default:
      return <FileTextIcon size={20} weight="duotone" />;
  }
}

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
      <div className="clue-panel-heading">
        <h2 id="clue-panel-title">{uiCopy.cluePanel.title}</h2>
        <span
          className="clue-panel-count tabular-nums"
          aria-label={uiCopy.cluePanel.unlockedCount(clues.length)}
        >
          {clues.length}
        </span>
      </div>
      <div className="clue-list">
        {clues.map((clue) => {
          const label = clue.title || clueLabels[clue.kind];
          const isNarrative = clue.kind === "letter" || clue.kind === "bless";
          const needsAttention = Boolean(
            isNarrative && attentionClueIds?.has(clue.id),
          );
          const lead = (
            <span className="clue-index" aria-hidden="true">
              <ClueKindIcon kind={clue.kind} />
            </span>
          );
          const content = (
            <div className="clue-card-body">
              {needsAttention && (
                <span className="clue-card-status">
                  {clue.kind === "letter"
                    ? uiCopy.cluePanel.letterWaiting
                    : uiCopy.cluePanel.blessingWaiting}
                </span>
              )}
              <strong>{label}</strong>
              {clue.content && (
                <RichContent source={clue.content} className="clue-preview" />
              )}
            </div>
          );
          const action = (
            <span className="clue-card-action" aria-hidden="true">
              {clue.kind === "link" ? (
                <ArrowUpRightIcon size={16} weight="bold" />
              ) : (
                <ArrowRightIcon size={16} weight="bold" />
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
