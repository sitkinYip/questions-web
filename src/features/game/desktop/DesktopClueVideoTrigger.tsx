import { PlayIcon, StarFourIcon } from "@phosphor-icons/react";

interface DesktopClueVideoTriggerProps {
  url: string;
  onPlay: (url: string) => void;
}

/** A media action, never a navigation link: CDN URLs must play in-page. */
export function DesktopClueVideoTrigger({
  url,
  onPlay,
}: DesktopClueVideoTriggerProps) {
  return (
    <button
      type="button"
      className="desktop-clue-video"
      aria-label="播放线索影像"
      aria-haspopup="dialog"
      onClick={() => onPlay(url)}
    >
      <span className="desktop-clue-video__seal" aria-hidden="true">
        <span className="desktop-clue-video__orbit" />
        <PlayIcon weight="fill" />
      </span>
      <span className="desktop-clue-video__copy" aria-hidden="true">
        <span className="desktop-clue-video__eyebrow">时空回溯</span>
        <strong>重现这一幕</strong>
        <span className="desktop-clue-video__hint">播放线索影像</span>
      </span>
      <StarFourIcon className="desktop-clue-video__star" aria-hidden="true" />
    </button>
  );
}
