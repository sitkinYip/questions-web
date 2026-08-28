import { useId, type ReactNode } from "react";
import { CompassIcon, StarFourIcon } from "@phosphor-icons/react";
import { CelestialAtlas } from "../../../components/effects/CelestialAtlas";

const loadingScenes = {
  player: {
    title: "拾起你的冒险足迹",
    label: "正在读取冒险者资料…",
    hint: "每一段走过的路，都有星光记得。",
  },
  journey: {
    title: "下一段冒险，正在苏醒",
    label: "正在准备本场冒险…",
    hint: "循着微光，走进故事的另一面。",
  },
  narrative: {
    title: "故事，正为你展开",
    label: "正在准备这份专属内容…",
    hint: "有些话，正等着被你读到。",
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
            QUESTIONS
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
          <p className="game-loading-screen__eyebrow">星图正在显现</p>
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
        答案之外 · 另有天地
        <span />
      </footer>
    </main>
  );
}
