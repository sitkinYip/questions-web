import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Quest } from "@/domain/quest/types";

const analyticsMocks = vi.hoisted(() => ({
  track: vi.fn(),
  trackOnce: vi.fn(),
}));

vi.mock("@/infrastructure/analytics", () => ({
  trackAnalytics: analyticsMocks.track,
  trackAnalyticsOnce: analyticsMocks.trackOnce,
}));

import { QuestSessionView } from "@/features/quest/QuestSessionView";

const choiceQuest: Quest = {
  id: "quest-21",
  step: 21,
  revision: "r1",
  kind: "choice",
  title: "守门人的问题",
  prompt: "请选择正确的星象",
  content: [],
  clues: [],
  acceptedAnswers: ["B"],
  options: [
    { key: "A", text: "月亮" },
    { key: "B", text: "北极星" },
  ],
  penaltyDurationsMs: [60_000],
  autoNext: false,
  isFinal: false,
};

describe("Quest session operational analytics", () => {
  beforeEach(() => {
    window.localStorage.clear();
    analyticsMocks.track.mockClear();
    analyticsMocks.trackOnce.mockClear();
  });

  it("reports enough wrong-answer context for remote assistance", () => {
    render(
      <QuestSessionView
        allQuests={[choiceQuest]}
        requestedSteps={[21]}
        userId="alice"
        missingSteps={[]}
      />,
    );

    fireEvent.click(screen.getByText("月亮"));
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));

    const answerEvent = analyticsMocks.track.mock.calls.find(
      ([event]) => event.name === "answer_submitted",
    );
    expect(answerEvent).toEqual([
      expect.objectContaining({
        name: "answer_submitted",
        questId: "quest-21",
        step: 21,
        title: "守门人的问题",
        question: "请选择正确的星象",
        answer: "A",
        normalizedAnswer: "a",
        acceptedAnswers: ["B"],
        options: [
          { key: "A", text: "月亮" },
          { key: "B", text: "北极星" },
        ],
        outcome: "incorrect",
        attemptStatus: "penalized",
        wrongCount: 1,
        progress: {
          activeStep: 21,
          completed: 0,
          total: 1,
          sessionStatus: "active",
        },
      }),
      "alice",
    ]);
    expect(answerEvent?.[0].penaltyEndsAt).toEqual(expect.any(Number));
  });
});
