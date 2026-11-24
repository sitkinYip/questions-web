import { uiCopy } from "@/config/ui-copy";
import { useId, type ReactNode } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { StarRingEmblem } from "@/components/brand/StarRingEmblem";

const loadingScenes = {
  player: {
    title: uiCopy.gameLoadingScreen.playerTitle,
    label: uiCopy.gameLoadingScreen.playerLabel,
    hint: uiCopy.gameLoadingScreen.playerHint,
  },
  journey: {
    title: uiCopy.gameLoadingScreen.assignmentTitle,
    label: uiCopy.gameLoadingScreen.assignmentLabel,
    hint: uiCopy.gameLoadingScreen.assignmentHint,
  },
  narrative: {
    title: uiCopy.gameLoadingScreen.narrativeTitle,
    label: uiCopy.gameLoadingScreen.narrativeLabel,
    hint: uiCopy.gameLoadingScreen.narrativeHint,
  },
} as const;

interface GameLoadingScreenProps {
  scene?: keyof typeof loadingScenes;
  header?: ReactNode;
}

/** Presentation only: the owning query determines when loading starts/ends. */
export function GameLoadingScreen({
  scene = "journey",
  header,
}: GameLoadingScreenProps) {
  const titleId = useId();
  const copy = loadingScenes[scene];
  return (
    <main className="game-loading-screen" aria-labelledby={titleId}>
      <div className="game-loading-screen__stars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="game-loading-screen__header">
        {header ?? (
          <span className="game-loading-screen__brand">
            <BrandMark size={28} />
            <span>{uiCopy.gameLoadingScreen.brand}</span>
          </span>
        )}
      </div>
      <section className="game-loading-screen__stage">
        <div className="game-loading-screen__art" aria-hidden="true">
          <StarRingEmblem />
        </div>
        <div className="game-loading-screen__copy">
          <h1 id={titleId}>{copy.title}</h1>
          <p
            className="game-loading-screen__status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="game-loading-screen__pulse" aria-hidden="true" />
            <span>{copy.label}</span>
          </p>
        </div>
        <p className="game-loading-screen__hint">{copy.hint}</p>
      </section>
      <footer className="game-loading-screen__footer">
        <span />
        {uiCopy.gameLoadingScreen.tagline}
        <span />
      </footer>
    </main>
  );
}
