import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { gameApi } from "../../api/game.client";
import type { GameAssignment, GamePlayer } from "../../api/game.contracts";
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
  return render(
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
