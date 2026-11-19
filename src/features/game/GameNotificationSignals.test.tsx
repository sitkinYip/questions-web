import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { gameApi } from "@/api/game.client";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { makeNotifications, makePlayer } from "@/test/game-fixtures";
import { GameContext } from "@/features/game/useGame";
import { gameKeys } from "@/features/game/game-queries";
import { GameNavigation } from "@/features/game/components/GameNavigation";
import { GameNotificationSignals } from "@/features/game/GameNotificationSignals";

const player = makePlayer();
const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
});
function Location() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="current-path">{location.pathname}</output>
      <button
        onClick={() => {
          void navigate("/");
        }}
      >
        返回首页
      </button>
    </>
  );
}
function setup(path = "/") {
  const notes = makeNotifications();
  vi.spyOn(gameApi, "notifications").mockResolvedValue({ items: notes });
  const read = vi.spyOn(gameApi, "readNotification");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  clients.push(client);
  client.setQueryData(gameKeys.notifications(player.id), { items: notes });
  render(
    <QueryClientProvider client={client}>
      <GameContext.Provider
        value={{ player, setPlayer: vi.fn(), logout: vi.fn() }}
      >
        <MemoryRouter initialEntries={[path]}>
          <ToastProvider>
            <GameNotificationSignals />
            <GameNavigation />
            <Location />
          </ToastProvider>
        </MemoryRouter>
      </GameContext.Provider>
    </QueryClientProvider>,
  );
  const add = async (id: string) => {
    await act(async () => {
      client.setQueryData(gameKeys.notifications(player.id), {
        items: [...notes, { ...notes[0], id, readAt: "" }],
      });
    });
  };
  return { client, notes, read, add };
}
it("hydrates a badge without announcing old unread, and a new arrival can open the inbox without acknowledging it", async () => {
  const { read, add } = setup();
  expect(screen.getByRole("link", { name: "来信" })).toHaveAttribute(
    "aria-description",
    "你有 1 封未读来信。",
  );
  expect(screen.queryByText("有新的旅途来信")).not.toBeInTheDocument();
  await add("fresh-letter");
  await screen.findByText("有新的旅途来信");
  fireEvent.click(screen.getByRole("button", { name: "查看来信" }));
  await waitFor(() =>
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      "/notifications",
    ),
  );
  expect(read).not.toHaveBeenCalled();
});
it("closing an arrival prevents repeated polls from showing it again, and another new ID can notify", async () => {
  const { add, read } = setup();
  await add("first-new");
  fireEvent.click(
    await screen.findByRole("button", { name: "关闭有新的旅途来信" }),
  );
  await add("first-new");
  expect(screen.queryByText("有新的旅途来信")).not.toBeInTheDocument();
  await add("second-new");
  await screen.findByText("有新的旅途来信");
  fireEvent.click(
    screen.getByRole("button", { name: /有新的旅途来信.*封未读来信/ }),
  );
  await waitFor(() =>
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      "/notifications",
    ),
  );
  expect(read).not.toHaveBeenCalled();
});
it("does not duplicate quest notifications or announce them when leaving gameplay", async () => {
  const { add } = setup("/play/assignment");
  await add("quest-arrival");
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "来信" })).toHaveAttribute(
      "aria-description",
      "你有 2 封未读来信。",
    ),
  );
  expect(screen.queryByText("有新的旅途来信")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "返回首页" }));
  expect(screen.queryByText("有新的旅途来信")).not.toBeInTheDocument();
});
it("removes the bottom badge after a server read projection", async () => {
  const { client, notes } = setup();
  await act(async () => {
    client.setQueryData(gameKeys.notifications(player.id), {
      items: notes.map((note) => ({
        ...note,
        readAt: "confirmed-server-time",
      })),
    });
  });
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "来信" })).not.toHaveAttribute(
      "aria-description",
    ),
  );
});
