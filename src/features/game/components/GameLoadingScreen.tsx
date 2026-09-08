import { uiCopy } from "@/config/ui-copy";
import { useId, type ReactNode } from "react";
import { CompassIcon, StarFourIcon } from "@phosphor-icons/react";
import { CelestialAtlas } from "@/components/effects/CelestialAtlas";

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
            <CompassIcon weight="thin" aria-hidden="true" />
            {uiCopy.gameLoadingScreen.brand}
          </span>
        )}
      </div>
      <section className="game-loading-screen__stage">
        <div className="game-loading-screen__art" aria-hidden="true">
          <span className="game-loading-screen__ticks" />
          <span className="game-loading-screen__trail" />
          <CelestialAtlas />
        </div>
        <div className="game-loading-screen__copy">
          <p className="game-loading-screen__eyebrow">
            {uiCopy.gameLoadingScreen.eyebrow}
          </p>
          <h1 id={titleId}>{copy.title}</h1>
          <p
            className="game-loading-screen__status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="game-loading-screen__pulse" aria-hidden="true" />
            {copy.label}
          </p>
        </div>
        <div className="game-loading-screen__path" aria-hidden="true">
          <span />
          <StarFourIcon weight="fill" />
          <span />
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
