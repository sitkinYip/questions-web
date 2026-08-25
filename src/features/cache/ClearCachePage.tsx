import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchQuests } from "../../api/client";
import { AppDialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/FormControls";
import { overlayPriority } from "../../components/ui/overlay-context";
import {
  clearRecordPenalty,
  deleteLocalRecords,
  matchesLocalRecordFilter,
  scanLocalQuestionRecords,
  type LocalQuestionRecord,
  type LocalRecordFilterKind,
} from "../../infrastructure/storage/record-manager";

const kindLabels: Record<LocalQuestionRecord["kind"], string> = {
  attempt: "新版答题记录",
  "legacy-completion": "旧版通关记录",
  "legacy-penalty": "旧版惩罚记录",
  rank: "等级动画记录",
  notification: "通知已读记录",
  "letter-cache": "Letter 数据缓存",
  "audio-preference": "背景音乐偏好",
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
  if (record.isCorrupt) return "记录内容损坏，可安全删除";
  if (record.kind === "attempt" && record.attempt) {
    const labels = {
      unanswered: "未作答",
      incorrect: "回答错误",
      penalized: "惩罚中",
      completed: "已完成",
    };
    return `${labels[record.attempt.status]} · 错误 ${record.attempt.wrongCount} 次`;
  }
  if (record.kind === "rank") return `等级 ${record.rank || "未知"}`;
  return record.format === "current" ? "当前格式" : "兼容旧格式";
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
        refresh(`已删除 ${pendingAction.records.length} 条本地记录。`);
      } else {
        const cleared = pendingAction.records.filter((record) =>
          clearRecordPenalty(window.localStorage, record),
        ).length;
        refresh(`已解除 ${cleared} 条惩罚记录。`);
      }
    } catch {
      refresh("浏览器拒绝了本次本地记录操作，请检查存储权限后重试。");
    }
    setPendingAction(null);
  };

  return (
    <main className="records-page">
      <header className="records-header">
        <div>
          <p className="eyebrow">Local memory ledger</p>
          <h1>本地记录管理</h1>
          <p>
            仅管理 Questions
            已知命名空间；同域名下其他应用的数据不会出现在这里。
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          返回
        </Button>
      </header>

      {questsQuery.isError && (
        <aside className="inline-warning" role="status">
          无法读取最新题目元数据；新版记录仍可管理，部分旧记录可能无法识别
          step。
        </aside>
      )}

      <section className="record-summary" aria-label="记录概览">
        <div>
          <strong>{records.length}</strong>
          <span>全部记录</span>
        </div>
        <div>
          <strong>
            {records.filter((item) => item.format === "current").length}
          </strong>
          <span>新版格式</span>
        </div>
        <div>
          <strong>
            {records.filter((item) => item.format === "legacy").length}
          </strong>
          <span>旧版兼容</span>
        </div>
        <div>
          <strong>{records.filter((item) => item.isCorrupt).length}</strong>
          <span>损坏记录</span>
        </div>
      </section>

      <section className="record-filters" aria-label="筛选本地记录">
        <Field label="记录类型">
          <Select
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as LocalRecordFilterKind)
            }
          >
            <option value="all">全部 Questions 记录</option>
            <option value="progress">答题进度</option>
            <option value="penalty">惩罚记录</option>
            <option value="rank">等级动画</option>
            <option value="system">通知、音频与 Letter 缓存</option>
          </Select>
        </Field>
        <Field label="题目 step">
          <Input
            value={step}
            inputMode="numeric"
            placeholder="全部"
            onChange={(event) => setStep(event.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Field label="用户 ID">
          <Input
            value={userId}
            placeholder="全部用户"
            onChange={(event) => setUserId(event.target.value)}
          />
        </Field>
        <Field label="等级">
          <Input
            value={rank}
            placeholder="全部等级"
            onChange={(event) => setRank(event.target.value)}
          />
        </Field>
      </section>

      <div className="record-list-heading">
        <div>
          <p className="eyebrow">Matched records</p>
          <h2>{filteredRecords.length} 条匹配记录</h2>
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
              解除全部惩罚
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
              删除筛选记录
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
        <section className="record-list" aria-label="本地记录列表">
          {filteredRecords.map((record) => (
            <article className="record-item" key={record.key}>
              <div className="record-item-main">
                <div className="record-badges">
                  <span>{kindLabels[record.kind]}</span>
                  <span>{record.format === "current" ? "v1" : "legacy"}</span>
                  {record.isCorrupt && <span className="is-corrupt">损坏</span>}
                </div>
                <h3>{recordDetail(record)}</h3>
                <dl>
                  {record.step !== undefined && (
                    <>
                      <dt>Step</dt>
                      <dd>{record.step}</dd>
                    </>
                  )}
                  {record.userId !== undefined && (
                    <>
                      <dt>用户</dt>
                      <dd>{record.userId || "旅行者"}</dd>
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
                    解除惩罚
                  </Button>
                )}
                <Button
                  size="small"
                  variant="danger"
                  onClick={() =>
                    setPendingAction({ type: "delete", records: [record] })
                  }
                >
                  删除记录
                </Button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="records-empty">
          <span aria-hidden="true">✓</span>
          <h2>当前范围没有记录</h2>
          <p>调整筛选条件，或返回答题页面继续冒险。</p>
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
          pendingAction?.type === "delete" ? "确认删除本地记录" : "确认解除惩罚"
        }
        overlayClassName="record-confirm-backdrop"
        contentClassName="record-confirm"
        closeOnOutside={false}
      >
        {pendingAction && (
          <>
            <p className="eyebrow">Confirm local change</p>
            <h2 id="record-confirm-title">
              {pendingAction.type === "delete"
                ? "确认删除本地记录？"
                : "确认解除惩罚？"}
            </h2>
            <p>
              将影响 {pendingAction.records.length} 条明确列出的 Questions
              记录。
              {pendingAction.type === "delete" && "删除后无法从浏览器恢复。"}
            </p>
            <div>
              <Button
                size="small"
                variant="secondary"
                onClick={() => setPendingAction(null)}
              >
                取消
              </Button>
              <Button
                size="small"
                variant={pendingAction.type === "delete" ? "danger" : "primary"}
                onClick={confirmAction}
              >
                {pendingAction.type === "delete" ? "确认删除" : "确认解除"}
              </Button>
            </div>
          </>
        )}
      </AppDialog>
    </main>
  );
}
