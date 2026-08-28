import { useState } from "react";
import { Link } from "react-router-dom";
import { ScrollIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import type { QuestClue } from "../../../domain/quest/types";
import { Button } from "../../../components/ui/Button";
import { RichContent } from "../../content/RichContent";
import { DesktopClueVideoTrigger } from "./DesktopClueVideoTrigger";

interface DesktopClueShelfProps {
  clues: readonly QuestClue[];
  openText: (clue: QuestClue) => void;
  openImages: (urls: readonly string[], index?: number) => void;
  openVideo: (url: string) => void;
}

export function DesktopClueShelf({
  clues,
  openText,
  openImages,
  openVideo,
}: DesktopClueShelfProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = clues.find((clue) => clue.id === selectedId) ?? clues.at(-1);
  if (!selected) return null;
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
      <nav className="desktop-clues__index" aria-label="已解锁线索">
        {clues.map((clue, index) => (
          <button
            key={clue.id}
            type="button"
            aria-pressed={clue.id === selected.id}
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
        tabIndex={0}
        aria-label={selected.title || "线索正文"}
      >
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
        {(selected.kind === "link" || selected.kind === "letter") &&
          selected.href &&
          (selected.linkTarget === "internal" || selected.kind === "letter" ? (
            <Link className="game-action-link" to={selected.href}>
              打开这份线索 <ArrowUpRightIcon aria-hidden="true" />
            </Link>
          ) : (
            <a
              className="game-action-link"
              href={selected.href}
              target="_blank"
              rel="noopener noreferrer"
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
