import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import type { GamePlayer } from "@/api/game.contracts";
import { uiCopy } from "@/config/ui-copy";

export function GameHeaderView({
  player,
  title,
  backTo,
  backLabel,
  progress,
  navigation,
  floating = false,
  hidden = false,
}: {
  player: Pick<GamePlayer, "displayName" | "level">;
  title?: string;
  backTo?: string;
  backLabel?: string;
  progress?: { completed: number; total: number };
  navigation?: ReactNode;
  floating?: boolean;
  hidden?: boolean;
}) {
  const heading = title?.trim() || player.displayName;
  return (
    <header
      className="session-header"
      data-floating={floating ? "true" : undefined}
      data-hidden={floating && hidden ? "true" : undefined}
    >
      <div className="session-header__start">
        {backTo ? (
          <Link
            className="session-header__back"
            to={backTo}
            aria-label={backLabel || "返回启程"}
          >
            <ArrowLeftIcon size={20} aria-hidden="true" />
          </Link>
        ) : (
          <span className="session-header__spacer" aria-hidden="true" />
        )}
      </div>
      <p className="session-header__title" title={heading}>
        {heading}
      </p>
      <div className="session-header__actions">
        {navigation || (
          <span className="session-header__spacer" aria-hidden="true" />
        )}
      </div>
      {progress && (
        <span
          className="session-progress sr-only"
          aria-label={uiCopy.gameContext.progressLabel}
        >
          <strong className="tabular-nums" key={progress.completed}>
            {progress.completed}/{progress.total}
          </strong>
          <span>{uiCopy.gameContext.completed}</span>
        </span>
      )}
    </header>
  );
}
