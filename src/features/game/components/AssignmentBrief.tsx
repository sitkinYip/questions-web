import {
  MapTrifoldIcon,
  PuzzlePieceIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import type { GameAssignment } from "../../../api/game.contracts";
import { Button } from "../../../components/ui/Button";
import { CelestialAtlas } from "../../../components/effects/CelestialAtlas";
import {
  assignmentState,
  formatGameDate,
  rankRequirement,
} from "../game-presentation";
import { GameFailure } from "./GameState";

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
        <p className="eyebrow">一段新的旅程</p>
        <h1>{assignment.title}</h1>
        <p className="assignment-brief__description">
          {assignment.description || "循着线索，去发现故事另一面的答案。"}
        </p>
        <dl className="assignment-brief__facts">
          <div>
            <dt>
              <PuzzlePieceIcon aria-hidden="true" />
              谜题
            </dt>
            <dd>{assignment.totalLevels} 道等待解开</dd>
          </div>
          <div>
            <dt>
              <MapTrifoldIcon aria-hidden="true" />
              参与等级
            </dt>
            <dd>{rankRequirement(assignment)}</dd>
          </div>
          <div>
            <dt>
              <ClockIcon aria-hidden="true" />
              开放时间
            </dt>
            <dd>
              {assignment.startsAt ? (
                <time dateTime={assignment.startsAt}>
                  {formatGameDate(assignment.startsAt)}
                </time>
              ) : (
                "现在就能出发"
              )}
            </dd>
          </div>
          {assignment.endsAt && (
            <div>
              <dt>旅程截止</dt>
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
              ? "，请联系现场工作人员。"
              : state.kind === "locked"
                ? "，请确认场次的参与等级。"
                : "，旅程开放后就能出发。"}
          </p>
        )}
        {!!error && <GameFailure error={error} />}
        <Button
          variant="primary"
          className="game-cta"
          onClick={onStart}
          disabled={pending || !state.canStart}
        >
          {pending ? "正在进入…" : "开始本场冒险"}
          <ArrowRightIcon aria-hidden="true" />
        </Button>
        <p className="game-muted">解谜进度会自动保存，随时可以回来继续。</p>
      </div>
    </section>
  );
}
