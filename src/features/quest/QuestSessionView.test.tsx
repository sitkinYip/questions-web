import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Quest } from "../../domain/quest/types";
import { progressKey } from "../../infrastructure/storage/progress.repository";
import { rankUpKey } from "../../infrastructure/storage/rank.repository";
import { QuestSessionView } from "./QuestSessionView";

const textQuest: Quest = {
  id: "quest-11",
  step: 11,
  revision: "r1",
  kind: "text",
  title: "第一道测试题",
  prompt: "请输入星辰大海",
  content: [],
  clues: [],
  acceptedAnswers: ["星辰，大海"],
  options: [],
  penaltyDurationsMs: [],
  autoNext: false,
  isFinal: false,
};

const choiceQuest: Quest = {
  ...textQuest,
  id: "quest-12",
  step: 12,
  title: "第二道测试题",
  kind: "choice",
  acceptedAnswers: ["B"],
  options: [
    { key: "A", text: "错误选项" },
    { key: "B", text: "正确选项" },
  ],
  penaltyDurationsMs: [1_000],
};

describe("QuestSessionView", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it("submits a normalized text answer and persists completion", () => {
    render(
      <QuestSessionView
        allQuests={[textQuest]}
        requestedSteps={[11]}
        userId="alice"
        missingSteps={[]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value: "星辰 大海" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));

    expect(screen.getByText("全部题目已经完成。")).toBeInTheDocument();
    expect(
      window.localStorage.getItem(progressKey(textQuest, "alice")),
    ).toContain('"status":"completed"');
  });

  it("keeps later quests locked until the active quest is completed", () => {
    render(
      <QuestSessionView
        allQuests={[textQuest, choiceQuest]}
        requestedSteps={[11, 12]}
        userId="alice"
        missingSteps={[]}
      />,
    );

    expect(screen.getByRole("button", { name: /02/ })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value: "星辰大海" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
    expect(screen.getByRole("button", { name: /02/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: "前往下一题" })).toBeEnabled();
  });

  it("reveals clues and opens the first AutoPlay clue after success", () => {
    render(
      <QuestSessionView
        allQuests={[
          {
            ...textQuest,
            clues: [
              {
                id: "quest-11:clue:0",
                kind: "text",
                title: "自动密卷",
                content: "[[线索已经解锁]]",
                autoPlay: true,
                imageUrls: [],
              },
            ],
          },
        ]}
        requestedSteps={[11]}
        userId="alice"
        missingSteps={[]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value: "星辰大海" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));

    const dialog = screen.getByRole("dialog", { name: "自动密卷" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("线索已经解锁")).toBeInTheDocument();
  });

  it("auto-advances only after an AutoPlay text clue is closed", () => {
    const secondTextQuest: Quest = {
      ...textQuest,
      id: "quest-12-text",
      step: 12,
      title: "等待进入的第二题",
    };
    render(
      <QuestSessionView
        allQuests={[
          {
            ...textQuest,
            autoNext: true,
            clues: [
              {
                id: "auto-text",
                kind: "text",
                content: "关闭后继续",
                autoPlay: true,
                imageUrls: [],
              },
            ],
          },
          secondTextQuest,
        ]}
        requestedSteps={[11, 12]}
        userId="alice"
        missingSteps={[]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value: "星辰大海" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
    expect(
      screen.getByRole("dialog", { name: "古老密卷" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭线索" }));
    expect(
      screen.getByRole("heading", { name: "等待进入的第二题" }),
    ).toBeInTheDocument();
  });

  it("uses a short delay before auto-advancing when no clue is playing", () => {
    vi.useFakeTimers();
    const secondTextQuest: Quest = {
      ...textQuest,
      id: "quest-12-text",
      step: 12,
      title: "延迟后的第二题",
    };
    render(
      <QuestSessionView
        allQuests={[{ ...textQuest, autoNext: true }, secondTextQuest]}
        requestedSteps={[11, 12]}
        userId="alice"
        missingSteps={[]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value: "星辰大海" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
    expect(
      screen.getByRole("heading", { name: "第一道测试题" }),
    ).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1_500));
    expect(
      screen.getByRole("heading", { name: "延迟后的第二题" }),
    ).toBeInTheDocument();
  });

  it("reveals the matching combined clue after every selected quest completes", () => {
    const secondTextQuest: Quest = {
      ...textQuest,
      id: "quest-12-text",
      step: 12,
      title: "组合测试第二题",
    };
    render(
      <QuestSessionView
        allQuests={[textQuest, secondTextQuest]}
        requestedSteps={[11, 12]}
        userId="alice"
        missingSteps={[]}
        multiQuestClue={{
          id: "combined-11-12",
          qas: "11,12",
          title: "两题共同真相",
          content: "[[本场线索已解锁]]",
          buttonText: "收下线索",
          revision: "r1",
        }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value: "星辰大海" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
    fireEvent.click(screen.getByRole("button", { name: "前往下一题" }));
    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value: "星辰大海" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));

    expect(
      screen.getByRole("dialog", { name: "组合谜题全部破解" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "查看组合结果" }));
    const dialog = screen.getByRole("dialog", { name: "两题共同真相" });
    expect(within(dialog).getByText("本场线索已解锁")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "收下线索" }));
    expect(
      screen.getByRole("button", { name: "查看本场线索" }),
    ).toBeInTheDocument();
  });

  it("prioritizes final feedback, then AutoPlay, then the safe destination", () => {
    const finalQuest: Quest = {
      ...textQuest,
      id: "quest-final",
      step: 52,
      title: "最终测试题",
      isFinal: true,
      finalDestination: { href: "/bless?from=questions", target: "internal" },
      clues: [
        {
          id: "final-clue",
          kind: "text",
          title: "最终密卷",
          content: "旅程仍将继续",
          autoPlay: true,
          imageUrls: [],
        },
      ],
    };
    render(
      <QuestSessionView
        allQuests={[finalQuest]}
        requestedSteps={[52]}
        userId="alice"
        missingSteps={[]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value: "星辰大海" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));

    expect(
      screen.getByRole("dialog", { name: "所有迷雾已经消散" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "最终密卷" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "揭示最终线索" }));
    expect(
      screen.getByRole("dialog", { name: "最终密卷" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭线索" }));

    expect(screen.getByRole("link", { name: "继续旅程" })).toHaveAttribute(
      "href",
      "/bless?from=questions&returnTo=%2F",
    );
  });

  it("uses final feedback instead of multi feedback when a final quest completes the set", () => {
    const finalQuest: Quest = {
      ...textQuest,
      id: "quest-final-in-set",
      step: 52,
      title: "组合中的最终题",
      isFinal: true,
    };
    render(
      <QuestSessionView
        allQuests={[textQuest, finalQuest]}
        requestedSteps={[11, 52]}
        userId="alice"
        missingSteps={[]}
        multiQuestClue={{
          id: "final-combined",
          qas: "11,52",
          title: "最终本场线索",
          content: "最终组合已经解锁",
          revision: "r1",
        }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value: "星辰大海" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
    fireEvent.click(screen.getByRole("button", { name: "前往下一题" }));
    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value: "星辰大海" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));

    expect(
      screen.getByRole("dialog", { name: "所有迷雾已经消散" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "组合谜题全部破解" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "揭示最终线索" }));
    expect(
      screen.getByRole("dialog", { name: "最终本场线索" }),
    ).toBeInTheDocument();
  });

  it("shows an eligible rank upgrade once per user and rank", () => {
    vi.useFakeTimers();
    const rankedQuest: Quest = {
      ...textQuest,
      rank: {
        code: "3",
        name: "守护咪",
        isSpecial: false,
        numericValue: 3,
      },
    };
    const first = render(
      <QuestSessionView
        allQuests={[rankedQuest]}
        requestedSteps={[11]}
        userId="alice"
        missingSteps={[]}
      />,
    );

    expect(screen.getByText("RANK 3 · 守护咪")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1_500));
    expect(screen.getByRole("dialog", { name: "守护咪" })).toBeInTheDocument();
    expect(window.localStorage.getItem(rankUpKey("alice", "3"))).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: "继续冒险" }));
    first.unmount();

    render(
      <QuestSessionView
        allQuests={[rankedQuest]}
        requestedSteps={[11]}
        userId="alice"
        missingSteps={[]}
      />,
    );
    act(() => vi.advanceTimersByTime(2_000));
    expect(
      screen.queryByRole("dialog", { name: "守护咪" }),
    ).not.toBeInTheDocument();
  });
});
