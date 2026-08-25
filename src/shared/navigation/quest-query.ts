export interface QuestRouteSelection {
  steps: number[];
  userId: string;
  mode: "single" | "multiple";
}

export function parseQuestRoute(search: string): QuestRouteSelection {
  const params = new URLSearchParams(search);
  const multiSteps = (params.get("qas") ?? "")
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((step) => Number.isInteger(step) && step > 0);
  const qa = Number.parseInt(params.get("qa") ?? "1", 10);
  const steps =
    multiSteps.length > 1 ? multiSteps : [Number.isNaN(qa) ? 1 : qa];
  return {
    steps,
    userId: params.get("user") ?? "",
    mode: steps.length > 1 ? "multiple" : "single",
  };
}
