import type { ReactNode } from "react";
import type { GamePlayer } from "@/api/game.contracts";
import { uiCopy } from "@/config/ui-copy";
export function GameHeaderView({
  player,
  progress,
  navigation,
}: {
  player: Pick<GamePlayer, "displayName" | "level">;
  progress?: { completed: number; total: number };
  navigation?: ReactNode;
}) {
  return (
    <header className="session-header">
      <div className="traveler-identity">
        {navigation}
        <div>
          <p className="eyebrow">{uiCopy.gameContext.eyebrow}</p>
          <p className="traveler-name">{player.displayName}</p>
          <p className="traveler-rank">
            {uiCopy.gameContext.rank(player.level.order, player.level.name)}
          </p>
        </div>
      </div>
      {progress && (
        <div
          className="session-progress"
          aria-label={uiCopy.gameContext.progressLabel}
        >
          <strong key={progress.completed}>
            {progress.completed}/{progress.total}
          </strong>
          <span>{uiCopy.gameContext.completed}</span>
        </div>
      )}
    </header>
  );
}
