import { uiCopy } from "@/config/ui-copy";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { fetchMultiQuestClue, fetchQuests } from "@/api/client";
import { selectQuestsByStep } from "@/application/quest/create-session";
import { parseQuestRoute } from "@/shared/navigation/quest-query";
import { ApiErrorState } from "@/features/errors/ApiErrorState";
import { QuestSessionView } from "@/features/quest/QuestSessionView";

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
        <p className="eyebrow">{uiCopy.questEntryPage.eyebrow}</p>
        <h1>{uiCopy.questEntryPage.loadingTitle}</h1>
        <p>{uiCopy.questEntryPage.loadingDescription}</p>
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
        <p className="eyebrow">{uiCopy.questEntryPage.notFoundEyebrow}</p>
        <h1>{uiCopy.questEntryPage.notFoundTitle}</h1>
        <p>
          {uiCopy.questEntryPage.invalidSelection(selection.steps.join(", "))}
        </p>
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
