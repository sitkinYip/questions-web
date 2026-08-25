import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { fetchMultiQuestClue, fetchQuests } from "../../api/client";
import { selectQuestsByStep } from "../../application/quest/create-session";
import { parseQuestRoute } from "../../shared/navigation/quest-query";
import { ApiErrorState } from "../errors/ApiErrorState";
import { QuestSessionView } from "./QuestSessionView";

export function QuestEntryPage() {
  const location = useLocation();
  const selection = useMemo(
    () => parseQuestRoute(location.search),
    [location.search],
  );
  const questsQuery = useQuery({
    queryKey: ["quests"],
    queryFn: ({ signal }) => fetchQuests(signal),
  });
  const multiClueQuery = useQuery({
    queryKey: ["multi-quest-clue", selection.steps.join(",")],
    queryFn: ({ signal }) => fetchMultiQuestClue(selection.steps, signal),
    enabled: selection.mode === "multiple",
  });

  if (questsQuery.isPending) {
    return (
      <main className="centered-state" aria-busy="true">
        <p className="eyebrow">Questions</p>
        <h1>正在读取冒险记录</h1>
        <p>通过 local.sitkin.top 连接 PocketBase…</p>
      </main>
    );
  }

  if (questsQuery.isError) {
    return (
      <ApiErrorState
        error={questsQuery.error}
        onRetry={() => void questsQuery.refetch()}
      />
    );
  }

  const selected = selectQuestsByStep(questsQuery.data, selection.steps);
  if (selected.quests.length === 0) {
    return (
      <main className="centered-state error-state">
        <p className="eyebrow">Quest not found</p>
        <h1>没有找到对应题目</h1>
        <p>请检查 qa 或 qas 参数：{selection.steps.join(", ")}</p>
      </main>
    );
  }

  const sessionKey = `${selection.userId}:${selected.quests
    .map((quest) => `${quest.id}@${quest.revision}`)
    .join(",")}`;

  return (
    <QuestSessionView
      key={sessionKey}
      allQuests={questsQuery.data}
      requestedSteps={selection.steps}
      userId={selection.userId}
      missingSteps={selected.missingSteps}
      multiQuestClue={multiClueQuery.data ?? null}
    />
  );
}
