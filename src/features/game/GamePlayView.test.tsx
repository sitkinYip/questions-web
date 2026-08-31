import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { gameApi } from "../../api/game.client";
import type {
  GameAssignment,
  GameClue,
  GamePlayer,
} from "../../api/game.contracts";
import type { Quest } from "../../domain/quest/types";
import { QuestSessionView } from "../quest/QuestSessionView";
import { GamePlayView } from "./GamePlayPage";
import { GameContext } from "./useGame";
import { ThemeProvider } from "../../components/ui/ThemeProvider";
import { progressKey } from "../../infrastructure/storage/progress.repository";

const quest: Quest = {
  id: "step1",
  step: 1,
  revision: "r1",
  kind: "text",
  title: "星辰之门",
  prompt: "看见繁星与海洋",
  content: [{ text: "看见繁星与海洋", imageUrls: [] }],
  options: [],
  acceptedAnswers: ["星辰大海"],
  clues: [],
  penaltyDurationsMs: [],
  autoNext: false,
  isFinal: false,
};
const player: GamePlayer = {
  id: "alice",
  account: "alice",
  displayName: "远航者",
  avatar: "",
  mustChangePassword: false,
  totalXp: 0,
  level: {
    id: "rank1",
    order: 1,
    name: "探索者",
    minTotalXp: 0,
    visualConfig: {},
  },
  nextLevel: null,
};
function assignment(q = quest): GameAssignment {
  return {
    id: "assignment1",
    player: player.id,
    session: "session1",
    status: "active",
    order: 0,
    startsAt: "",
    endsAt: "",
    startedAt: new Date().toISOString(),
    completedAt: "",
    previousAssignment: "",
    title: "测试场次",
    description: "",
    minLevel: 1,
    maxLevel: null,
    completedLevels: 0,
    totalLevels: 1,
    currentIndex: 0,
    presentation: {},
    completionTarget: null,
    serverTime: new Date().toISOString(),
    clues: [],
    levels: [
      {
        id: q.id,
        position: 1,
        xp: 50,
        autoNext: false,
        completedAt: "",
        wrongCount: 0,
        cooldownUntil: "",
        locked: false,
        presentationOverride: {},
        lastAnswer: "",
        question: {
          id: "question1",
          kind: q.kind,
          title: q.title!,
          placeholder: "",
          content: [
            {
              text: q.prompt,
              hint: "",
              imageUrl: "",
              imageUrls: [],
              videoUrl: "",
            },
          ],
          options: q.options.map((option) => ({
            key: option.key,
            text: option.text || "",
            imageUrl: "",
            videoUrl: "",
          })),
        },
      },
    ],
  };
}
function gameClue(overrides: Partial<GameClue> = {}): GameClue {
  const id = overrides.id || "session-clue";
  const source = overrides.source || "session";
  return {
    id,
    source,
    definitionId: id,
    question: "",
    sessionLevel: "step1",
    trigger:
      overrides.trigger ||
      (source === "question" ? "question_completed" : "level_completed"),
    kind: "text",
    position: 0,
    narrative: "",
    autoPlay: false,
    unlockedAt: "2026-08-31T00:00:00Z",
    content: {
      title: id,
      text: `${id} content`,
      url: "",
      imageUrls: [],
      buttonText: "",
    },
    ...overrides,
  };
}
function appendLevel(value: GameAssignment, id: string, title: string) {
  const level = structuredClone(value.levels[0]);
  level.id = id;
  level.position = value.levels.length + 1;
  level.completedAt = "";
  level.lastAnswer = "";
  level.question = {
    ...level.question!,
    id: `question-${id}`,
    title,
  };
  value.levels.push(level);
  value.totalLevels = value.levels.length;
  return level;
}
const clients: QueryClient[] = [];
function renderGame(value = assignment()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  function Harness() {
    const query = useQuery({
      queryKey: ["game", player.id, "assignment", value.id],
      queryFn: async () => value,
      initialData: value,
      staleTime: Infinity,
    });
    return <GamePlayView assignment={query.data} />;
  }
  const view = render(
    <MemoryRouter>
      <ThemeProvider>
        <QueryClientProvider client={client}>
          <GameContext.Provider
            value={{ player, setPlayer: vi.fn(), logout: vi.fn() }}
          >
            <Harness />
          </GameContext.Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
  return { ...view, client };
}
function renderOriginal(q = quest) {
  return render(
    <MemoryRouter>
      <QuestSessionView
        allQuests={[q]}
        requestedSteps={[1]}
        userId={player.id}
        missingSteps={[]}
      />
    </MemoryRouter>,
  );
}
function cardMarkup() {
  return document.querySelector(".quest-card")!.outerHTML;
}
function submit(value?: string) {
  if (value !== undefined)
    fireEvent.change(screen.getByPlaceholderText("输入你的答案"), {
      target: { value },
    });
  fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(gameApi, "notifications").mockResolvedValue({ items: [] });
});
afterEach(() => {
  cleanup();
  for (const client of clients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

describe("original question-card presentation parity", () => {
  it.each([undefined, "", "   "])(
    "keeps the original empty-answer feedback for %s without submitting to the server",
    async (value) => {
      const answer = vi.spyOn(gameApi, "answer");
      renderOriginal();
      submit(value);
      const original = cardMarkup();
      expect(original).toMatchSnapshot();
      cleanup();
      renderGame();
      submit(value);
      expect(cardMarkup()).toBe(original);
      expect(screen.getByRole("status")).toHaveTextContent(
        "请先输入或选择答案。",
      );
      expect(screen.getByPlaceholderText("输入你的答案")).not.toBeRequired();
      expect(answer).not.toHaveBeenCalled();
    },
  );
  it("keeps the untouched card markup identical", () => {
    renderOriginal();
    const original = cardMarkup();
    expect(original).toMatchSnapshot();
    cleanup();
    renderGame();
    expect(cardMarkup()).toBe(original);
  });
  it("keeps the original unselected-choice feedback", () => {
    const q: Quest = {
      ...quest,
      kind: "choice",
      options: [
        { key: "A", text: "月亮" },
        { key: "B", text: "北极星" },
      ],
    };
    const answer = vi.spyOn(gameApi, "answer");
    renderOriginal(q);
    submit();
    const original = cardMarkup();
    expect(original).toMatchSnapshot();
    cleanup();
    renderGame(assignment(q));
    submit();
    expect(cardMarkup()).toBe(original);
    expect(answer).not.toHaveBeenCalled();
  });
  it("renders the original incorrect-answer state after the server rejects an answer", async () => {
    renderOriginal();
    submit("错误");
    const original = cardMarkup();
    expect(original).toMatchSnapshot();
    cleanup();
    const value = assignment();
    const rejected = structuredClone(value);
    rejected.levels[0].wrongCount = 1;
    rejected.levels[0].lastAnswer = "错误";
    vi.spyOn(gameApi, "answer").mockResolvedValue({
      result: "incorrect",
      assignment: rejected,
      player,
      xpDelta: 0,
      rewardIds: [],
    });
    renderGame(value);
    submit("错误");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "答案不正确，可以继续尝试。",
      ),
    );
    expect(cardMarkup()).toBe(original);
  });
  it("renders the original completed state only after server settlement", async () => {
    renderOriginal();
    submit("星辰大海");
    const original = cardMarkup();
    expect(original).toMatchSnapshot();
    cleanup();
    const value = assignment(),
      completed = structuredClone(value);
    completed.status = "completed";
    completed.completedLevels = 1;
    completed.levels[0].completedAt = new Date().toISOString();
    completed.levels[0].lastAnswer = "星辰大海";
    vi.spyOn(gameApi, "answer").mockResolvedValue({
      result: "correct",
      assignment: completed,
      player,
      xpDelta: 50,
      rewardIds: [],
    });
    renderGame(value);
    submit("星辰大海");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "全部题目已经完成。",
      ),
    );
    expect(cardMarkup()).toBe(original);
  });
  it("does not invent completion feedback when revisiting a completed question", () => {
    window.localStorage.setItem(
      progressKey(quest, player.id),
      JSON.stringify({
        version: 1,
        attempt: {
          questId: quest.id,
          status: "completed",
          input: "星辰大海",
          wrongCount: 0,
          penaltyEndsAt: null,
          completedAt: Date.now(),
        },
      }),
    );
    renderOriginal();
    const original = cardMarkup();
    expect(original).toMatchSnapshot();
    cleanup();
    const value = assignment();
    value.status = "completed";
    value.completedLevels = 1;
    value.levels[0].completedAt = new Date().toISOString();
    value.levels[0].lastAnswer = "星辰大海";
    renderGame(value);
    expect(cardMarkup()).toBe(original);
  });
  it("keeps transport errors in the original inline feedback component", async () => {
    vi.spyOn(gameApi, "answer").mockRejectedValue(
      new Error("连接暂时中断，请重试。"),
    );
    renderGame();
    submit("星辰大海");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "连接暂时中断，请重试。",
      ),
    );
    expect(screen.getByRole("status")).toHaveClass("feedback");
    expect(document.querySelector(".game-error")).toBeNull();
    expect(screen.getByRole("button", { name: "提交答案" })).toBeEnabled();
    await act(async () => {});
  });
});

it("keeps a formerly untitled question untitled even when the catalog has an internal name", () => {
  const q = { ...quest, title: undefined };
  renderOriginal(q);
  const original = cardMarkup();
  cleanup();
  const value = assignment(q);
  value.levels[0].question!.title = "后台题库名称";
  value.levels[0].presentationOverride.hideTitle = true;
  renderGame(value);
  expect(cardMarkup()).toBe(original);
  expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
});
it("allows a later question to explicitly omit the session background", () => {
  const value = assignment();
  value.presentation.backgroundUrl = "https://assets.example/first.jpg";
  value.levels[0].presentationOverride.backgroundMode = "none";
  renderGame(value);
  expect(document.querySelector(".quest-background")).toBeNull();
});
it.each(["cooldown", "locked"])(
  "preserves the original %s choice presentation",
  (kind) => {
    const q: Quest = {
      ...quest,
      kind: "choice",
      options: [
        { key: "A", text: "月亮" },
        { key: "B", text: "北极星" },
      ],
    };
    const end = Date.now() + 180000;
    window.localStorage.setItem(
      progressKey(q, player.id),
      JSON.stringify({
        version: 1,
        attempt: {
          questId: q.id,
          status: "penalized",
          input: "A",
          wrongCount: 1,
          penaltyEndsAt: kind === "locked" ? -1 : end,
          completedAt: null,
        },
      }),
    );
    renderOriginal(q);
    const original = cardMarkup();
    cleanup();
    const value = assignment(q);
    Object.assign(value.levels[0], {
      wrongCount: 1,
      lastAnswer: "A",
      locked: kind === "locked",
      cooldownUntil: kind === "cooldown" ? new Date(end).toISOString() : "",
    });
    renderGame(value);
    expect(cardMarkup()).toBe(original);
  },
);

describe("session and question clue integration", () => {
  it.each([
    {
      clueAutoPlay: true,
      effectAutoPlay: false,
      expected: "not.toBeInTheDocument",
    },
    {
      clueAutoPlay: false,
      effectAutoPlay: true,
      expected: "toBeInTheDocument",
    },
  ] as const)(
    "uses the start-time autoplay snapshot ($effectAutoPlay), not the mutable clue value ($clueAutoPlay)",
    async ({ clueAutoPlay, effectAutoPlay, expected }) => {
      const value = assignment();
      value.status = "assigned";
      value.startedAt = "";
      const entered = structuredClone(value);
      entered.status = "active";
      entered.startedAt = "2026-08-31T00:00:00Z";
      const clue = gameClue({
        id: "start-snapshot-clue",
        trigger: "start",
        sessionLevel: "",
        autoPlay: clueAutoPlay,
        content: {
          ...gameClue().content,
          title: "进入场次行为快照",
          text: "后台更新不应改变这次进入场次的演出。",
        },
      });
      entered.clues = [clue];
      entered.transitionEffects = [
        { type: "clue", clueId: clue.id, autoPlay: effectAutoPlay },
      ];
      const start = vi.spyOn(gameApi, "start").mockResolvedValue(entered);

      renderGame(value);
      fireEvent.click(screen.getByRole("button", { name: /开始本场冒险/ }));
      await waitFor(() => expect(start).toHaveBeenCalledOnce());
      const dialog = screen.queryByRole("dialog", {
        name: "进入场次行为快照",
      });
      if (expected === "toBeInTheDocument") expect(dialog).toBeInTheDocument();
      else expect(dialog).not.toBeInTheDocument();
    },
  );

  it("renders session clues before common question clues", () => {
    const value = assignment();
    value.levels[0].completedAt = "2026-08-31T00:00:00Z";
    value.completedLevels = 1;
    value.clues = [
      gameClue({
        id: "common-first-position",
        source: "question",
        definitionId: "common-first-position",
        question: "question1",
        position: 0,
        content: {
          ...gameClue().content,
          title: "通用线索",
          text: "通用线索正文",
        },
      }),
      gameClue({
        id: "session-later-position",
        position: 9,
        content: {
          ...gameClue().content,
          title: "场次线索",
          text: "场次线索正文",
        },
      }),
    ];

    renderGame(value);
    const panel = screen.getByRole("region", { name: "通关线索" });
    const cards = within(panel).getAllByRole("button");
    expect(cards.map((card) => card.textContent)).toEqual([
      expect.stringContaining("场次线索"),
      expect.stringContaining("通用线索"),
    ]);
  });

  it("quietly reveals a common clue added after the level was completed", async () => {
    const value = assignment();
    value.status = "completed";
    value.completedLevels = 1;
    value.levels[0].completedAt = "2026-08-31T00:00:00Z";
    const { client } = renderGame(value);
    const refreshed = structuredClone(value);
    refreshed.clues = [
      gameClue({
        id: "late-common",
        source: "question",
        definitionId: "late-common",
        question: "question1",
        autoPlay: true,
        content: {
          ...gameClue().content,
          title: "后来补充的通用线索",
          text: "只展示，不重播动作。",
        },
      }),
    ];

    act(() => {
      client.setQueryData(
        ["game", player.id, "assignment", value.id],
        refreshed,
      );
    });

    expect(await screen.findByText("后来补充的通用线索")).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "后来补充的通用线索" }),
    ).not.toBeInTheDocument();
  });

  it("shows a common clue only on its concrete session level on mobile", () => {
    const value = assignment();
    appendLevel(value, "step2", "第二道题");
    value.completedLevels = 2;
    value.levels.forEach((level) => {
      level.completedAt = "2026-08-31T00:00:00Z";
    });
    value.clues = [
      gameClue({
        id: "first-common",
        source: "question",
        definitionId: "first-common",
        question: "question1",
        sessionLevel: "step1",
        content: {
          ...gameClue().content,
          title: "第一题通用线索",
        },
      }),
      gameClue({
        id: "second-common",
        source: "question",
        definitionId: "second-common",
        question: "question-step2",
        sessionLevel: "step2",
        content: {
          ...gameClue().content,
          title: "第二题通用线索",
        },
      }),
    ];

    renderGame(value);
    expect(screen.getByText("第一题通用线索")).toBeInTheDocument();
    expect(screen.queryByText("第二题通用线索")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /02/ }));
    expect(screen.getByText("第二题通用线索")).toBeInTheDocument();
    expect(screen.queryByText("第一题通用线索")).not.toBeInTheDocument();
  });

  it.each([undefined, []] as const)(
    "does not autoplay a late clue from another answered level with effects %o",
    async (effects) => {
      const value = assignment();
      value.levels[0].completedAt = "2026-08-31T00:00:00Z";
      value.completedLevels = 1;
      appendLevel(value, "step2", "正在回答的第二题");
      appendLevel(value, "step3", "尚未回答的第三题");
      value.currentIndex = 1;
      const settled = structuredClone(value);
      settled.levels[1].completedAt = "2026-08-31T00:01:00Z";
      settled.completedLevels = 2;
      settled.currentIndex = 2;
      settled.clues = [
        gameClue({
          id: "late-first-level-clue",
          source: "question",
          definitionId: "late-first-level-clue",
          question: "question1",
          sessionLevel: "step1",
          autoPlay: true,
          content: {
            ...gameClue().content,
            title: "第一题迟到的线索",
          },
        }),
      ];
      vi.spyOn(gameApi, "answer").mockResolvedValue({
        result: "correct",
        assignment: settled,
        player,
        xpDelta: 50,
        rewardIds: [],
        effects: effects === undefined ? undefined : [...effects],
      });

      renderGame(value);
      submit("星辰大海");
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "回答正确，当前题目已完成。",
        ),
      );
      expect(
        screen.queryByRole("dialog", { name: "第一题迟到的线索" }),
      ).not.toBeInTheDocument();
    },
  );

  it("uses explicit effects and the settled auto-next config", async () => {
    const value = assignment();
    appendLevel(value, "step2", "下一道题");
    value.levels[0].autoNext = false;
    const settled = structuredClone(value);
    settled.levels[0].completedAt = "2026-08-31T00:01:00Z";
    settled.levels[0].autoNext = true;
    settled.completedLevels = 1;
    settled.currentIndex = 1;
    const common = gameClue({
      id: "current-common",
      source: "question",
      definitionId: "current-common",
      question: "question1",
      autoPlay: true,
      content: {
        ...gameClue().content,
        title: "本题即时线索",
        text: "关闭后按服务端最新配置前进。",
      },
    });
    settled.clues = [common];
    vi.spyOn(gameApi, "answer").mockResolvedValue({
      result: "correct",
      assignment: settled,
      player,
      xpDelta: 50,
      rewardIds: [],
      effects: [{ type: "clue", clueId: common.id }],
    });

    renderGame(value);
    submit("星辰大海");
    expect(
      await screen.findByRole("dialog", { name: "本题即时线索" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭线索" }));
    expect(
      await screen.findByRole("heading", { name: "下一道题" }),
    ).toBeInTheDocument();
  });

  it.each([
    {
      clueAutoPlay: true,
      effectAutoPlay: false,
      expected: "not.toBeInTheDocument",
    },
    {
      clueAutoPlay: false,
      effectAutoPlay: true,
      expected: "toBeInTheDocument",
    },
  ] as const)(
    "uses the answer-time autoplay snapshot ($effectAutoPlay), not the mutable clue value ($clueAutoPlay)",
    async ({ clueAutoPlay, effectAutoPlay, expected }) => {
      const value = assignment();
      appendLevel(value, "step2", "下一道题");
      const settled = structuredClone(value);
      settled.levels[0].completedAt = "2026-08-31T00:01:00Z";
      settled.completedLevels = 1;
      settled.currentIndex = 1;
      const common = gameClue({
        id: "snapshot-common",
        source: "question",
        definitionId: "snapshot-common",
        question: "question1",
        autoPlay: clueAutoPlay,
        content: {
          ...gameClue().content,
          title: "答题时行为快照",
          text: "更新发生在答题之后时，不应改变这次演出。",
        },
      });
      settled.clues = [common];
      vi.spyOn(gameApi, "answer").mockResolvedValue({
        result: "correct",
        assignment: settled,
        player,
        xpDelta: 50,
        rewardIds: [],
        effects: [
          {
            type: "clue",
            clueId: common.id,
            autoPlay: effectAutoPlay,
          },
        ],
      });

      renderGame(value);
      submit("星辰大海");
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "回答正确，当前题目已完成。",
        ),
      );
      const dialog = screen.queryByRole("dialog", {
        name: "答题时行为快照",
      });
      if (expected === "toBeInTheDocument") expect(dialog).toBeInTheDocument();
      else expect(dialog).not.toBeInTheDocument();
    },
  );

  it.each(["incorrect", "already_completed"] as const)(
    "does not run common-clue effects for a %s answer response",
    async (result) => {
      const value = assignment();
      const settled = structuredClone(value);
      const common = gameClue({
        id: `${result}-common`,
        source: "question",
        definitionId: `${result}-common`,
        question: "question1",
        autoPlay: true,
        content: {
          ...gameClue().content,
          title: `${result} 不应播放`,
        },
      });
      settled.clues = [common];
      if (result === "incorrect") settled.levels[0].wrongCount = 1;
      else {
        settled.status = "completed";
        settled.completedLevels = 1;
        settled.levels[0].completedAt = "2026-08-31T00:01:00Z";
      }
      const answer = vi.spyOn(gameApi, "answer").mockResolvedValue({
        result,
        assignment: settled,
        player,
        xpDelta: 0,
        rewardIds: [],
        effects: [{ type: "clue", clueId: common.id }],
      });

      renderGame(value);
      submit("星辰大海");
      await waitFor(() => expect(answer).toHaveBeenCalledOnce());
      expect(
        screen.queryByRole("dialog", { name: `${result} 不应播放` }),
      ).not.toBeInTheDocument();
    },
  );
});
