import { uiCopy } from "@/config/ui-copy";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchQuests } from "@/api/client";
import { AppDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/FormControls";
import { overlayPriority } from "@/components/ui/overlay-context";
import {
  clearRecordPenalty,
  deleteLocalRecords,
  matchesLocalRecordFilter,
  scanLocalQuestionRecords,
  type LocalQuestionRecord,
  type LocalRecordFilterKind,
} from "@/infrastructure/storage/record-manager";

const kindLabels: Record<LocalQuestionRecord["kind"], string> = {
  attempt: uiCopy.clearCachePage.progressRecords,
  "legacy-completion": uiCopy.clearCachePage.legacyCompletedRecords,
  "legacy-penalty": uiCopy.clearCachePage.legacyPenaltyRecords,
  rank: uiCopy.clearCachePage.rankRecords,
  notification: uiCopy.clearCachePage.notificationRecords,
  "letter-cache": uiCopy.clearCachePage.letterCache,
  "audio-preference": uiCopy.clearCachePage.audioPreference,
};

type PendingAction =
  | { type: "delete"; records: readonly LocalQuestionRecord[] }
  | { type: "clear-penalty"; records: readonly LocalQuestionRecord[] };

function initialKind(search: string): LocalRecordFilterKind {
  const type = new URLSearchParams(search).get("type");
  if (type === "qa") return "progress";
  if (type === "penalty") return "penalty";
  if (type === "rankUp") return "rank";
  return "all";
}

function initialStep(search: string) {
  const value = Number.parseInt(
    new URLSearchParams(search).get("step") ?? "",
    10,
  );
  return Number.isInteger(value) && value > 0 ? String(value) : "";
}

function hasPenalty(record: LocalQuestionRecord) {
  return (
    record.kind === "legacy-penalty" ||
    (record.kind === "attempt" &&
      Boolean(record.attempt && record.attempt.penaltyEndsAt !== null))
  );
}

function recordDetail(record: LocalQuestionRecord) {
  if (record.isCorrupt) return uiCopy.clearCachePage.damagedRecord;
  if (record.kind === "attempt" && record.attempt) {
    const labels = {
      unanswered: uiCopy.clearCachePage.unanswered,
      incorrect: uiCopy.clearCachePage.incorrect,
      penalized: uiCopy.clearCachePage.penalized,
      completed: uiCopy.clearCachePage.completed,
    };
    return uiCopy.clearCachePage.attemptSummary(
      labels[record.attempt.status],
      record.attempt.wrongCount,
    );
  }
  if (record.kind === "rank")
    return uiCopy.clearCachePage.rank(
      record.rank || uiCopy.clearCachePage.unknownRank,
    );
  return record.format === "current"
    ? uiCopy.clearCachePage.currentFormat
    : uiCopy.clearCachePage.legacyFormat;
}

export function ClearCachePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const questsQuery = useQuery({
    queryKey: ["quests"],
    queryFn: ({ signal }) => fetchQuests(signal),
  });
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const [kind, setKind] = useState<LocalRecordFilterKind>(() =>
    initialKind(location.search),
  );
  const [step, setStep] = useState(() => initialStep(location.search));
  const [userId, setUserId] = useState(() => params.get("user") ?? "");
  const [rank, setRank] = useState(() => params.get("rank") ?? "");
  const [revision, setRevision] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");

  const references = useMemo(
    () =>
      (questsQuery.data ?? []).map((quest) => ({
        step: quest.step,
        revision: quest.revision,
      })),
    [questsQuery.data],
  );
  const records = useMemo(() => {
    void revision;
    return scanLocalQuestionRecords(window.localStorage, references);
  }, [references, revision]);
  const filter = useMemo(
    () => ({
      kind,
      step: step ? Number(step) : undefined,
      userId: userId.trim() || undefined,
      rank: rank.trim() || undefined,
    }),
    [kind, rank, step, userId],
  );
  const filteredRecords = records.filter((record) =>
    matchesLocalRecordFilter(record, filter),
  );
  const penaltyRecords = filteredRecords.filter(hasPenalty);

  const refresh = (message: string) => {
    setRevision((current) => current + 1);
    setFeedback(message);
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    try {
      if (pendingAction.type === "delete") {
        deleteLocalRecords(
          window.localStorage,
          pendingAction.records.map((record) => record.key),
        );
        refresh(uiCopy.clearCachePage.deleted(pendingAction.records.length));
      } else {
        const cleared = pendingAction.records.filter((record) =>
          clearRecordPenalty(window.localStorage, record),
        ).length;
        refresh(uiCopy.clearCachePage.released(cleared));
      }
    } catch {
      refresh(uiCopy.clearCachePage.operationFailed);
    }
    setPendingAction(null);
  };

  return (
    <main className="records-page">
      <header className="records-header">
        <div>
          <p className="eyebrow">{uiCopy.clearCachePage.eyebrow}</p>
          <h1>{uiCopy.clearCachePage.title}</h1>
          <p>{uiCopy.clearCachePage.description}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          {uiCopy.clearCachePage.back}
        </Button>
      </header>

      {questsQuery.isError && (
        <aside className="inline-warning" role="status">
          {uiCopy.clearCachePage.metadataFailed}
        </aside>
      )}

      <section
        className="record-summary"
        aria-label={uiCopy.clearCachePage.overview}
      >
        <div>
          <strong>{records.length}</strong>
          <span>{uiCopy.clearCachePage.allRecords}</span>
        </div>
        <div>
          <strong>
            {records.filter((item) => item.format === "current").length}
          </strong>
          <span>{uiCopy.clearCachePage.currentRecords}</span>
        </div>
        <div>
          <strong>
            {records.filter((item) => item.format === "legacy").length}
          </strong>
          <span>{uiCopy.clearCachePage.legacyRecords}</span>
        </div>
        <div>
          <strong>{records.filter((item) => item.isCorrupt).length}</strong>
          <span>{uiCopy.clearCachePage.damagedRecords}</span>
        </div>
      </section>

      <section
        className="record-filters"
        aria-label={uiCopy.clearCachePage.filterLabel}
      >
        <Field label={uiCopy.clearCachePage.recordType}>
          <Select
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as LocalRecordFilterKind)
            }
          >
            <option value="all">
              {uiCopy.clearCachePage.allQuestionsRecords}
            </option>
            <option value="progress">{uiCopy.clearCachePage.progress}</option>
            <option value="penalty">{uiCopy.clearCachePage.penalty}</option>
            <option value="rank">{uiCopy.clearCachePage.rankAnimation}</option>
            <option value="system">{uiCopy.clearCachePage.otherRecords}</option>
          </Select>
        </Field>
        <Field label={uiCopy.clearCachePage.step}>
          <Input
            value={step}
            inputMode="numeric"
            placeholder={uiCopy.clearCachePage.allSteps}
            onChange={(event) => setStep(event.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Field label={uiCopy.clearCachePage.userId}>
          <Input
            value={userId}
            placeholder={uiCopy.clearCachePage.allUsers}
            onChange={(event) => setUserId(event.target.value)}
          />
        </Field>
        <Field label={uiCopy.clearCachePage.level}>
          <Input
            value={rank}
            placeholder={uiCopy.clearCachePage.allLevels}
            onChange={(event) => setRank(event.target.value)}
          />
        </Field>
      </section>

      <div className="record-list-heading">
        <div>
          <p className="eyebrow">{uiCopy.clearCachePage.resultsEyebrow}</p>
          <h2>{uiCopy.clearCachePage.matchCount(filteredRecords.length)}</h2>
        </div>
        <div className="record-bulk-actions">
          {penaltyRecords.length > 0 && (
            <Button
              size="small"
              variant="secondary"
              onClick={() =>
                setPendingAction({
                  type: "clear-penalty",
                  records: penaltyRecords,
                })
              }
            >
              {uiCopy.clearCachePage.releaseAll}
            </Button>
          )}
          {filteredRecords.length > 0 && (
            <Button
              size="small"
              variant="danger"
              onClick={() =>
                setPendingAction({ type: "delete", records: filteredRecords })
              }
            >
              {uiCopy.clearCachePage.deleteFiltered}
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <p className="record-feedback" role="status">
          {feedback}
        </p>
      )}

      {filteredRecords.length > 0 ? (
        <section
          className="record-list"
          aria-label={uiCopy.clearCachePage.listLabel}
        >
          {filteredRecords.map((record) => (
            <article className="record-item" key={record.key}>
              <div className="record-item-main">
                <div className="record-badges">
                  <span>{kindLabels[record.kind]}</span>
                  <span>{record.format === "current" ? "v1" : "legacy"}</span>
                  {record.isCorrupt && (
                    <span className="is-corrupt">
                      {uiCopy.clearCachePage.damaged}
                    </span>
                  )}
                </div>
                <h3>{recordDetail(record)}</h3>
                <dl>
                  {record.step !== undefined && (
                    <>
                      <dt>{uiCopy.clearCachePage.stepLabel}</dt>
                      <dd>{record.step}</dd>
                    </>
                  )}
                  {record.userId !== undefined && (
                    <>
                      <dt>{uiCopy.clearCachePage.user}</dt>
                      <dd>{record.userId || uiCopy.clearCachePage.traveler}</dd>
                    </>
                  )}
                </dl>
                <code>{record.key}</code>
              </div>
              <div className="record-item-actions">
                {hasPenalty(record) && (
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() =>
                      setPendingAction({
                        type: "clear-penalty",
                        records: [record],
                      })
                    }
                  >
                    {uiCopy.clearCachePage.release}
                  </Button>
                )}
                <Button
                  size="small"
                  variant="danger"
                  onClick={() =>
                    setPendingAction({ type: "delete", records: [record] })
                  }
                >
                  {uiCopy.clearCachePage.delete}
                </Button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="records-empty">
          <span aria-hidden="true">✓</span>
          <h2>{uiCopy.clearCachePage.emptyTitle}</h2>
          <p>{uiCopy.clearCachePage.emptyDescription}</p>
        </section>
      )}

      <AppDialog
        overlayId="record-confirmation"
        priority={overlayPriority.confirmation}
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        accessibleTitle={
          pendingAction?.type === "delete"
            ? uiCopy.clearCachePage.deleteDialogTitle
            : uiCopy.clearCachePage.releaseDialogTitle
        }
        overlayClassName="record-confirm-backdrop"
        contentClassName="record-confirm"
        closeOnOutside={false}
      >
        {pendingAction && (
          <>
            <p className="eyebrow">{uiCopy.clearCachePage.confirmEyebrow}</p>
            <h2 id="record-confirm-title">
              {pendingAction.type === "delete"
                ? uiCopy.clearCachePage.deleteHeading
                : uiCopy.clearCachePage.releaseHeading}
            </h2>
            <p>
              {uiCopy.clearCachePage.affectedCount(
                pendingAction.records.length,
              )}
              {pendingAction.type === "delete" &&
                uiCopy.clearCachePage.irreversible}
            </p>
            <div>
              <Button
                size="small"
                variant="secondary"
                onClick={() => setPendingAction(null)}
              >
                {uiCopy.clearCachePage.cancel}
              </Button>
              <Button
                size="small"
                variant={pendingAction.type === "delete" ? "danger" : "primary"}
                onClick={confirmAction}
              >
                {pendingAction.type === "delete"
                  ? uiCopy.clearCachePage.confirmDelete
                  : uiCopy.clearCachePage.confirmRelease}
              </Button>
            </div>
          </>
        )}
      </AppDialog>
    </main>
  );
}
