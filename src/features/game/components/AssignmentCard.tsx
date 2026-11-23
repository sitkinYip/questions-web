import { uiCopy } from "@/config/ui-copy";
import { ArrowRightIcon, ClockIcon, LockKeyIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { GameAssignmentSummary } from "@/api/game.contracts";
import {
  assignmentState,
  formatGameDate,
  rankRequirement,
} from "@/features/game/game-presentation";
import { useSurfaceLight } from "@/shared/motion/useSurfaceLight";

export function AssignmentCard({
  item,
  rank,
  now,
}: {
  item: GameAssignmentSummary;
  rank: number;
  now: number;
  index: number;
}) {
  const state = assignmentState(item, rank, now);
  const active = state.kind === "active" || state.kind === "ready";
  const light = useSurfaceLight(state.kind === "locked");
  const showRankConstraint = item.minLevel > 1 || item.maxLevel !== null;
  return (
    <article
      className="chapter-card ui-glass ui-light-surface"
      data-state={state.kind}
      {...light}
    >
      <div className="chapter-card__body">
        <div className="chapter-card__top">
          <div className="chapter-card__title-row">
            {active && (
              <span className="chapter-card__beacon" aria-hidden="true" />
            )}
            {state.kind === "locked" && (
              <LockKeyIcon className="chapter-card__icon" aria-hidden="true" />
            )}
            <h2>{item.title}</h2>
            <span
              className="chapter-card__state"
              data-tone={active ? "accent" : "muted"}
            >
              {state.label}
            </span>
          </div>
          {item.description && (
            <p className="chapter-card__description">{item.description}</p>
          )}
          {(showRankConstraint || item.startsAt || item.endsAt) && (
            <div className="chapter-card__facts">
              {showRankConstraint && <span>{rankRequirement(item)}</span>}
              {(item.startsAt || item.endsAt) && (
                <span className="chapter-card__schedule">
                  <ClockIcon aria-hidden="true" />
                  {item.startsAt && (
                    <time dateTime={item.startsAt}>
                      {formatGameDate(item.startsAt)}
                    </time>
                  )}
                  {item.startsAt && item.endsAt && " – "}
                  {item.endsAt && (
                    <time dateTime={item.endsAt}>
                      {formatGameDate(item.endsAt)}
                    </time>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="chapter-card__footer">
          <div className="chapter-card__progress">
            <span>
              {uiCopy.assignmentCard.completedCount(
                item.completedLevels,
                item.totalLevels,
              )}
            </span>
            <progress
              value={item.completedLevels}
              max={Math.max(1, item.totalLevels)}
              aria-label={uiCopy.assignmentCard.progressLabel(item.title)}
            />
          </div>
          <Link
            className={`game-action-link${active ? " game-action-link--primary" : ""}`}
            to={`/play/${item.id}`}
          >
            {state.action}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
