import { uiCopy } from "@/config/ui-copy";
import {
  MapTrifoldIcon,
  PuzzlePieceIcon,
  ClockIcon,
  ArrowRightIcon,
  HouseLineIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { GameAssignment } from "@/api/game.contracts";
import { Button } from "@/components/ui/Button";
import { CelestialAtlas } from "@/components/effects/CelestialAtlas";
import {
  assignmentState,
  formatGameDate,
  rankRequirement,
} from "@/features/game/game-presentation";
import { GameFailure } from "@/features/game/components/GameState";

export function AssignmentBrief({
  assignment,
  rank,
  now,
  pending,
  error,
  onStart,
}: {
  assignment: GameAssignment;
  rank: number;
  now: number;
  pending: boolean;
  error: unknown;
  onStart: () => void;
}) {
  const state = assignmentState(assignment, rank, now);
  return (
    <section className="assignment-brief">
      <div className="assignment-brief__art">
        <CelestialAtlas compact />
      </div>
      <div className="assignment-brief__body">
        <p className="eyebrow">{uiCopy.assignmentBrief.eyebrow}</p>
        <h1>{assignment.title}</h1>
        <p className="assignment-brief__description">
          {assignment.description || uiCopy.assignmentBrief.description}
        </p>
        <dl className="assignment-brief__facts">
          <div>
            <dt>
              <PuzzlePieceIcon aria-hidden="true" />
              {uiCopy.assignmentBrief.puzzles}
            </dt>
            <dd>
              {uiCopy.assignmentBrief.puzzleCount(assignment.totalLevels)}
            </dd>
          </div>
          <div>
            <dt>
              <MapTrifoldIcon aria-hidden="true" />
              {uiCopy.assignmentBrief.level}
            </dt>
            <dd>{rankRequirement(assignment)}</dd>
          </div>
          <div>
            <dt>
              <ClockIcon aria-hidden="true" />
              {uiCopy.assignmentBrief.startsAt}
            </dt>
            <dd>
              {assignment.startsAt ? (
                <time dateTime={assignment.startsAt}>
                  {formatGameDate(assignment.startsAt)}
                </time>
              ) : (
                uiCopy.assignmentBrief.availableNow
              )}
            </dd>
          </div>
          {assignment.endsAt && (
            <div>
              <dt>{uiCopy.assignmentBrief.endsAt}</dt>
              <dd>
                <time dateTime={assignment.endsAt}>
                  {formatGameDate(assignment.endsAt)}
                </time>
              </dd>
            </div>
          )}
        </dl>
        {!state.canStart && (
          <p className="game-muted" role="status">
            {state.label}
            {state.kind === "expired"
              ? uiCopy.assignmentBrief.revokedHint
              : state.kind === "locked"
                ? uiCopy.assignmentBrief.levelHint
                : uiCopy.assignmentBrief.waitingHint}
          </p>
        )}
        {!!error && <GameFailure error={error} />}
        <div className="assignment-brief__actions">
          <Button
            variant="primary"
            className="game-cta"
            onClick={onStart}
            disabled={pending || !state.canStart}
          >
            {pending
              ? uiCopy.assignmentBrief.entering
              : uiCopy.assignmentBrief.start}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
          {state.kind === "expired" && (
            <Link className="game-action-link game-action-link--primary" to="/">
              <HouseLineIcon aria-hidden="true" />
              {uiCopy.assignmentBrief.home}
            </Link>
          )}
        </div>
        <p className="game-muted">{uiCopy.assignmentBrief.saveHint}</p>
      </div>
    </section>
  );
}
