import { uiCopy } from "@/config/ui-copy";
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
      aria-label={uiCopy.desktopClueVideoTrigger.play}
      aria-haspopup="dialog"
      onClick={() => onPlay(url)}
    >
      <span className="desktop-clue-video__seal" aria-hidden="true">
        <span className="desktop-clue-video__orbit" />
        <PlayIcon weight="fill" />
      </span>
      <span className="desktop-clue-video__copy" aria-hidden="true">
        <span className="desktop-clue-video__eyebrow">
          {uiCopy.desktopClueVideoTrigger.video}
        </span>
        <strong>{uiCopy.desktopClueVideoTrigger.title}</strong>
        <span className="desktop-clue-video__hint">
          {uiCopy.desktopClueVideoTrigger.play}
        </span>
      </span>
      <StarFourIcon className="desktop-clue-video__star" aria-hidden="true" />
    </button>
  );
}
