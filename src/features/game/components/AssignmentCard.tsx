import { uiCopy } from "@/config/ui-copy";
import {
  ArrowRightIcon,
  ClockIcon,
  LockSimpleIcon,
  StarFourIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { GameAssignmentSummary } from "@/api/game.contracts";
import {
  assignmentState,
  formatGameDate,
  rankRequirement,
} from "@/features/game/game-presentation";
import { useImmersiveLight } from "@/design/useImmersiveLight";
import { StarRing } from "@/design/components/StarRing";

export function AssignmentCard({
  item,
  rank,
  now,
  hero = false,
  unread = false,
}: {
  item: GameAssignmentSummary;
  rank: number;
  now: number;
  index: number;
  hero?: boolean;
  unread?: boolean;
}) {
  const state = assignmentState(item, rank, now);
  const active = state.kind === "active";
  const focal = active || (hero && state.kind === "ready");
  const locked = state.kind === "locked";
  const light = useImmersiveLight(!locked);
  const total = Math.max(1, item.totalLevels);
  const ratio = item.completedLevels / total;
  const showStateSub =
    state.kind === "waiting" ||
    state.kind === "expired" ||
    state.kind === "cancelled";
  const starCount = Math.min(total, 8);

  return (
    <article
      className={`chapter-card${focal ? " chapter-card--sweep" : ""}${hero ? " chapter-card--hero" : ""}`}
      data-state={state.kind}
      data-focal={focal || undefined}
      {...light}
    >
      {unread && (
        <span className="chapter-card__unread-ring" aria-hidden="true" />
      )}
      <Link
        className={`chapter-card__link${hero ? " chapter-card__hero" : " chapter-card__row"}`}
        to={`/play/${item.id}`}
        aria-description={unread ? uiCopy.gameUnread.assignment : undefined}
      >
        {hero ? (
          <>
            <div className="chapter-card__hero-top">
              <div className="chapter-card__info">
                <h2>{item.title}</h2>
                {showStateSub && (
                  <p className="chapter-card__sub">{state.label}</p>
                )}
                {(item.startsAt || item.endsAt) && (
                  <div className="chapter-card__schedule tabular-nums">
                    <ClockIcon aria-hidden="true" />
                    <span>
                      {item.startsAt && (
                        <>
                          {uiCopy.assignmentCard.startsAt}{" "}
                          <time dateTime={item.startsAt}>
                            {formatGameDate(item.startsAt)}
                          </time>
                        </>
                      )}
                      {item.startsAt && item.endsAt && " · "}
                      {item.endsAt && (
                        <>
                          {uiCopy.assignmentCard.endsAt}{" "}
                          <time dateTime={item.endsAt}>
                            {formatGameDate(item.endsAt)}
                          </time>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {locked ? (
                <span className="chapter-card__lock-badge tabular-nums">
                  <LockSimpleIcon size={17} aria-hidden="true" />
                  Lv.{item.minLevel}
                </span>
              ) : (
                <StarRing
                  progress={ratio}
                  size={74}
                  strokeWidth={4}
                  glow={active}
                  ariaLabel={uiCopy.assignmentCard.progressLabel(item.title)}
                >
                  <span className="chapter-card__fraction chapter-card__fraction--lg tabular-nums">
                    {item.completedLevels}
                    <small>/{item.totalLevels}</small>
                  </span>
                </StarRing>
              )}
            </div>

            <div className="chapter-card__hero-foot">
              <div className="chapter-card__stars" aria-hidden="true">
                {Array.from({ length: starCount }, (_, idx) => {
                  const starState =
                    idx < item.completedLevels
                      ? "done"
                      : idx === item.completedLevels
                        ? "current"
                        : "todo";
                  return (
                    <span
                      key={idx}
                      className="chapter-card__star"
                      data-state={starState}
                    >
                      <StarFourIcon
                        size={starState === "current" ? 16 : 13}
                        weight={starState === "todo" ? "regular" : "fill"}
                      />
                    </span>
                  );
                })}
              </div>
              <span className="chapter-card__cta">
                {state.kind === "active" ? "继续" : state.action}
                <ArrowRightIcon size={16} weight="bold" aria-hidden="true" />
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="chapter-card__info">
              <h2>{item.title}</h2>
              {showStateSub && (
                <p className="chapter-card__sub">{state.label}</p>
              )}
              {(item.startsAt || item.endsAt) && (
                <div className="chapter-card__schedule tabular-nums">
                  <ClockIcon aria-hidden="true" />
                  <span>
                    {item.startsAt && (
                      <>
                        {uiCopy.assignmentCard.startsAt}{" "}
                        <time dateTime={item.startsAt}>
                          {formatGameDate(item.startsAt)}
                        </time>
                      </>
                    )}
                    {item.startsAt && item.endsAt && " · "}
                    {item.endsAt && (
                      <>
                        {uiCopy.assignmentCard.endsAt}{" "}
                        <time dateTime={item.endsAt}>
                          {formatGameDate(item.endsAt)}
                        </time>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="chapter-card__right">
              {locked ? (
                <span className="chapter-card__lock-badge tabular-nums">
                  <LockSimpleIcon size={17} aria-hidden="true" />
                  Lv.{item.minLevel}
                </span>
              ) : (
                <>
                  <StarRing
                    progress={ratio}
                    size={54}
                    strokeWidth={3.5}
                    glow={active}
                    ariaLabel={uiCopy.assignmentCard.progressLabel(item.title)}
                  >
                    <span className="chapter-card__fraction tabular-nums">
                      {item.completedLevels}
                      <small>/{item.totalLevels}</small>
                    </span>
                  </StarRing>
                  <span className="chapter-card__arrow" aria-hidden="true">
                    <ArrowRightIcon size={16} weight="bold" />
                  </span>
                </>
              )}
            </div>
          </>
        )}
        <span className="sr-only">
          {state.label}，{rankRequirement(item)}，{state.action}
        </span>
      </Link>
    </article>
  );
}
