import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ScrollIcon,
  ArrowUpRightIcon,
  EnvelopeSimpleOpenIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import type { QuestClue } from "../../../domain/quest/types";
import { Button } from "../../../components/ui/Button";
import { RichContent } from "../../content/RichContent";
import { DesktopClueVideoTrigger } from "./DesktopClueVideoTrigger";

interface DesktopClueShelfProps {
  clues: readonly QuestClue[];
  openText: (clue: QuestClue) => void;
  openImages: (urls: readonly string[], index?: number) => void;
  openVideo: (url: string) => void;
  attentionClueIds?: ReadonlySet<string>;
  onClueOpen?: (clue: QuestClue) => void;
}

export function DesktopClueShelf({
  clues,
  openText,
  openImages,
  openVideo,
  attentionClueIds,
  onClueOpen,
}: DesktopClueShelfProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = clues.find((clue) => clue.id === selectedId) ?? clues.at(-1);
  const selectedClueId = selected?.id;
  const indexRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const narrativeAttentionIds = clues
    .filter(
      (clue) =>
        (clue.kind === "letter" || clue.kind === "bless") &&
        attentionClueIds?.has(clue.id),
    )
    .map((clue) => clue.id);
  const narrativeAttentionKey = narrativeAttentionIds.join("\u0000");
  const blessingAttentionId = clues.findLast(
    (clue) => clue.kind === "bless" && narrativeAttentionIds.includes(clue.id),
  )?.id;
  useLayoutEffect(() => {
    const index = indexRef.current;
    if (!index || typeof index.scrollTo !== "function") return;
    const indexRect = index.getBoundingClientRect();
    const attentionItems = (
      selectedId === null && narrativeAttentionKey
        ? narrativeAttentionKey.split("\u0000")
        : []
    )
      .map((id) => itemRefs.current.get(id))
      .filter((item): item is HTMLButtonElement => Boolean(item));
    let targetItems = attentionItems;
    if (attentionItems.length > 0) {
      const attentionRects = attentionItems.map((item) =>
        item.getBoundingClientRect(),
      );
      const groupWidth =
        Math.max(...attentionRects.map((rect) => rect.right)) -
        Math.min(...attentionRects.map((rect) => rect.left));
      if (groupWidth > indexRect.width) {
        const priorityItem = blessingAttentionId
          ? itemRefs.current.get(blessingAttentionId)
          : attentionItems.at(-1);
        targetItems = priorityItem ? [priorityItem] : [];
      }
    } else {
      const selectedItem = selectedClueId
        ? itemRefs.current.get(selectedClueId)
        : undefined;
      targetItems = selectedItem ? [selectedItem] : [];
    }
    if (targetItems.length === 0) return;
    const targetRects = targetItems.map((item) => item.getBoundingClientRect());
    const targetLeft = Math.min(...targetRects.map((rect) => rect.left));
    const targetRight = Math.max(...targetRects.map((rect) => rect.right));
    const isFullyVisible =
      targetLeft >= indexRect.left && targetRight <= indexRect.right;
    if (isFullyVisible) return;
    const maxLeft = Math.max(0, index.scrollWidth - index.clientWidth);
    const centeredLeft =
      index.scrollLeft +
      (targetLeft + targetRight) / 2 -
      (indexRect.left + indexRect.width / 2);
    index.scrollTo({
      left: Math.min(maxLeft, Math.max(0, centeredLeft)),
      behavior:
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
    });
  }, [
    blessingAttentionId,
    clues.length,
    narrativeAttentionKey,
    selectedId,
    selectedClueId,
  ]);
  if (!selected) return null;
  const selectedNeedsAttention = Boolean(
    attentionClueIds?.has(selected.id) &&
    (selected.kind === "letter" || selected.kind === "bless"),
  );
  return (
    <aside className="desktop-clues" aria-label="线索手记">
      <header className="desktop-clues__heading">
        <ScrollIcon weight="duotone" aria-hidden="true" />
        <div>
          <p className="eyebrow">沿着线索，继续探索</p>
          <h2>
            线索手记 <small>{clues.length}</small>
          </h2>
        </div>
      </header>
      <nav
        ref={indexRef}
        className="desktop-clues__index"
        aria-label="已解锁线索"
      >
        {clues.map((clue, index) => (
          <button
            key={clue.id}
            type="button"
            ref={(node) => {
              if (node) itemRefs.current.set(clue.id, node);
              else itemRefs.current.delete(clue.id);
            }}
            aria-pressed={clue.id === selected.id}
            data-attention={attentionClueIds?.has(clue.id) || undefined}
            onClick={() => setSelectedId(clue.id)}
          >
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            {clue.title || "未署名的线索"}
          </button>
        ))}
      </nav>
      <section
        key={selected.id}
        className={`desktop-clues__reading${selected.kind === "video" ? " desktop-clues__reading--video" : ""}`}
        data-kind={selected.kind}
        data-attention={attentionClueIds?.has(selected.id) || undefined}
        tabIndex={0}
        aria-label={selected.title || "线索正文"}
      >
        {selectedNeedsAttention && (
          <p className="desktop-clues__signal">
            {selected.kind === "letter" ? (
              <EnvelopeSimpleOpenIcon weight="duotone" aria-hidden="true" />
            ) : (
              <SparkleIcon weight="duotone" aria-hidden="true" />
            )}
            <span>
              <small>IMPORTANT SIGNAL</small>
              {selected.kind === "letter"
                ? "一封来信等待开启"
                : "一份祝福正在回响"}
            </span>
          </p>
        )}
        <h3>{selected.title || "未署名的线索"}</h3>
        {selected.content && (
          <RichContent
            source={selected.content}
            className="desktop-clues__text"
          />
        )}
        {selected.kind === "image" && (
          <div className="desktop-clues__images">
            {selected.imageUrls.map((url, index) => (
              <button
                type="button"
                key={url}
                onClick={() => openImages(selected.imageUrls, index)}
                aria-label={`放大线索图片 ${index + 1}`}
              >
                <img src={url} alt={`线索图片 ${index + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        )}
        {selected.kind === "video" && selected.url && (
          <DesktopClueVideoTrigger url={selected.url} onPlay={openVideo} />
        )}
        {(selected.kind === "link" ||
          selected.kind === "letter" ||
          selected.kind === "bless") &&
          selected.href &&
          (selected.linkTarget === "internal" ||
          selected.kind === "letter" ||
          selected.kind === "bless" ? (
            <Link
              className="game-action-link"
              to={selected.href}
              data-attention={attentionClueIds?.has(selected.id) || undefined}
              onClick={() => onClueOpen?.(selected)}
            >
              打开这份线索 <ArrowUpRightIcon aria-hidden="true" />
            </Link>
          ) : (
            <a
              className="game-action-link"
              href={selected.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClueOpen?.(selected)}
            >
              打开这份线索 <ArrowUpRightIcon aria-hidden="true" />
            </a>
          ))}
      </section>
      <footer className="desktop-clues__footer">
        <span>仅展示已解锁的内容</span>
        {selected.kind === "text" && (
          <Button
            variant="ghost"
            size="small"
            onClick={() => openText(selected)}
          >
            放大阅读
          </Button>
        )}
      </footer>
    </aside>
  );
}
