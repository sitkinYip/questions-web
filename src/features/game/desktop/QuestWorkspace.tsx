import type { ReactNode } from "react";
import { DesktopClueShelf } from "./DesktopClueShelf";
import type { QuestClue } from "../../../domain/quest/types";

export function QuestWorkspace({
  desktop,
  children,
  ...shelf
}: {
  desktop: boolean;
  children: ReactNode;
  clues: readonly QuestClue[];
  openText: (clue: QuestClue) => void;
  openImages: (urls: readonly string[], index?: number) => void;
  openVideo: (url: string) => void;
}) {
  if (!desktop) return children;
  return (
    <div
      className="quest-desktop__workspace"
      data-has-clues={shelf.clues.length > 0}
    >
      {children}
      {shelf.clues.length > 0 && <DesktopClueShelf {...shelf} />}
    </div>
  );
}
