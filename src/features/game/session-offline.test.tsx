import type { ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gameApi, GameApiError } from "../../api/game.client";
import {
  makeAssignment,
  makePlayer,
  makeRewards,
} from "../../test/game-fixtures";
import { GameContext } from "./useGame";
import { GameDashboard } from "./pages/GameDashboard";
import { GameRewardsPage } from "./pages/GameRewardsPage";
import { GamePlayPage } from "./GamePlayPage";
import { GameNarrativePage } from "./GameNarrativePage";
import { gameKeys } from "./game-queries";

// Keep the real query hooks, state split and page error branches. Decorative
// shells are irrelevant to API compatibility and are verified in the browser.
vi.mock("./components/GameLayout", () => ({
  GameLayout: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
  GamePageHeading: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("./components/PlayerPassport", () => ({ PlayerPassport: () => null }));
vi.mock("../../components/effects/CelestialAtlas", () => ({
  CelestialAtlas: () => null,
}));
vi.mock("../bless/canvas-engine", () => ({
  useBlessCanvas: () => ({ formText: vi.fn(), releaseText: vi.fn() }),
}));
vi.mock("./GameContext", async () => {
  const { GameFailure } = await import("./components/GameState");
  return { GameHeader: () => null, GameFailure };
});

const player = makePlayer();
const clients: QueryClient[] = [];
function mount(element: ReactNode, path = "/", route = "/") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  clients.push(client);
  render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={client}>
        <GameContext.Provider
          value={{ player, setPlayer: vi.fn(), logout: vi.fn() }}
        >
          <Routes>
            <Route path={route} element={element} />
          </Routes>
        </GameContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return client;
}
beforeEach(() => {
  vi.spyOn(gameApi, "notifications").mockResolvedValue({ items: [] });
});
afterEach(() => {
  cleanup();
  for (const client of clients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

describe("existing player pages support server-side session closure", () => {
  it("removes pending and completed entries after the server omits them without client filtering changes", async () => {
    const pending = makeAssignment({ id: "pending", title: "待答旧场次" });
    const completed = makeAssignment({
      id: "completed",
      title: "已答旧场次",
      status: "completed",
    });
    const assignments = vi
      .spyOn(gameApi, "assignments")
      .mockResolvedValue({ items: [pending, completed] });
    const client = mount(<GameDashboard />);
    await screen.findByText("待答旧场次");
    const history = screen.getByRole("tab", { name: /旅途回响/ });
    fireEvent.mouseDown(history, { button: 0, ctrlKey: false });
    await screen.findByText("已答旧场次");
    assignments.mockResolvedValue({ items: [] });
    await act(async () => {
      await client.invalidateQueries({
        queryKey: gameKeys.assignments(player.id),
      });
    });
    await waitFor(() =>
      expect(screen.queryByText("已答旧场次")).not.toBeInTheDocument(),
    );
    fireEvent.mouseDown(screen.getByRole("tab", { name: /待赴之约/ }), {
      button: 0,
      ctrlKey: false,
    });
    expect(screen.queryByText("待答旧场次")).not.toBeInTheDocument();
  });

  it("still displays available rewards, claim details and redeemed records independently of assignments", async () => {
    const assignments = vi
      .spyOn(gameApi, "assignments")
      .mockResolvedValue({ items: [] });
    const rewards = makeRewards();
    vi.spyOn(gameApi, "rewards").mockResolvedValue({ items: rewards });
    mount(<GameRewardsPage />, "/rewards", "/rewards");
    await screen.findByText(rewards[0].snapshot.name);
    expect(screen.getByText(rewards[0].claimDetails)).toBeInTheDocument();
    expect(screen.getByText("已领取 · 已核销")).toBeInTheDocument();
    expect(assignments).not.toHaveBeenCalled();
  });

  it("uses the existing error state for closed assignment links", async () => {
    vi.spyOn(gameApi, "assignment").mockRejectedValue(
      new GameApiError("SESSION_OFFLINE", "该场次已下线", 409),
    );
    mount(<GamePlayPage />, "/play/closed", "/play/:id");
    expect(await screen.findByText("该场次已下线")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "回到首页" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /提交答案/ }),
    ).not.toBeInTheDocument();
  });

  it("rejects closed narrative links through the existing request/error path", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "SESSION_OFFLINE",
              message: "该场次已下线",
            },
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    try {
      mount(
        <GameNarrativePage />,
        "/play/closed/content/letter",
        "/play/:id/content/:contentId",
      );
      expect(await screen.findByText("该场次已下线")).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("narrative return navigation", () => {
  it("keeps the return target inside the deployed application base", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "letter",
            kind: "letter",
            title: "来自星空的信",
            payload: {
              from: "北方",
              variant: "modern",
              hintText: "轻触信封",
              paragraphs: [{ content: "愿你找到自己的北方。" }],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    window.history.replaceState(
      null,
      "",
      "/questions/play/assignment1/content/letter",
    );

    try {
      mount(
        <GameNarrativePage />,
        "/play/assignment1/content/letter",
        "/play/:id/content/:contentId",
      );

      expect(
        await screen.findByRole("link", { name: "← 返回冒险" }),
      ).toHaveAttribute("href", "/questions/play/assignment1");
    } finally {
      window.history.replaceState(null, "", "/");
      vi.unstubAllGlobals();
    }
  });

  it("keeps the Bless return target inside the deployed application base", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "bless",
            kind: "bless",
            title: "来自星空的祝福",
            payload: {
              from: "北方",
              phrases: [{ text: "愿你找到自己的北方。" }],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    window.history.replaceState(
      null,
      "",
      "/questions/play/assignment1/content/bless",
    );

    try {
      mount(
        <GameNarrativePage />,
        "/play/assignment1/content/bless",
        "/play/:id/content/:contentId",
      );

      expect(
        await screen.findByRole("link", { name: "返回冒险" }),
      ).toHaveAttribute("href", "/questions/play/assignment1");
    } finally {
      window.history.replaceState(null, "", "/");
      vi.unstubAllGlobals();
    }
  });
});
