import {
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  LockKeyIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { GameAssignmentSummary } from "../../../api/game.contracts";
import {
  assignmentState,
  formatGameDate,
  rankRequirement,
} from "../game-presentation";

export function AssignmentCard({
  item,
  rank,
  now,
  index,
}: {
  item: GameAssignmentSummary;
  rank: number;
  now: number;
  index: number;
}) {
  const state = assignmentState(item, rank, now);
  const active = state.kind === "active" || state.kind === "ready";
  return (
    <article className="chapter-card" data-state={state.kind}>
      <div className="chapter-card__number" aria-hidden="true">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <small>CHAPTER</small>
        <i />
      </div>
      <div className="chapter-card__body">
        <p className="game-status" data-tone={active ? "accent" : "muted"}>
          {state.kind === "completed" ? (
            <CheckCircleIcon aria-hidden="true" />
          ) : state.kind === "locked" ? (
            <LockKeyIcon aria-hidden="true" />
          ) : (
            <span className="game-status__dot" aria-hidden="true" />
          )}
          {state.label}
        </p>
        <h2>{item.title}</h2>
        <p className="chapter-card__description">
          {item.description ||
            `${item.totalLevels} 道谜题，藏着尚未揭开的故事。`}
        </p>
        <div className="chapter-card__meta">
          <span>{item.totalLevels} 道谜题</span>
          <span>{rankRequirement(item)}</span>
        </div>
        {(item.startsAt || item.endsAt) && (
          <div className="chapter-card__schedule">
            <ClockIcon aria-hidden="true" />
            <span>
              {item.startsAt && (
                <>
                  开放{" "}
                  <time dateTime={item.startsAt}>
                    {formatGameDate(item.startsAt)}
                  </time>
                </>
              )}
              {item.startsAt && item.endsAt && <br />}
              {item.endsAt && (
                <>
                  截止{" "}
                  <time dateTime={item.endsAt}>
                    {formatGameDate(item.endsAt)}
                  </time>
                </>
              )}
            </span>
          </div>
        )}
        <div className="chapter-card__footer">
          <div className="chapter-card__progress">
            <span>
              已解开 {item.completedLevels} / {item.totalLevels}
            </span>
            <progress
              value={item.completedLevels}
              max={Math.max(1, item.totalLevels)}
              aria-label={`${item.title}探索进度`}
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
