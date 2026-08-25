import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClearCachePage } from "./ClearCachePage";

vi.mock("../../api/client", () => ({
  fetchQuests: vi.fn().mockResolvedValue([]),
}));

const key = "questions:v1:attempt:alice:11:r1";
const attempt = {
  questId: "quest-11",
  status: "penalized",
  input: "A",
  wrongCount: 2,
  penaltyEndsAt: -1,
  completedAt: null,
};

function renderPage(search = "") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/clearCache${search}`]}>
        <ClearCachePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ClearCachePage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(key, JSON.stringify({ version: 1, attempt }));
    window.localStorage.setItem("another-app-token", "keep");
  });

  it("honors legacy penalty query filters and clears only the penalty", () => {
    renderPage("?type=penalty&step=11&user=alice");

    const item = screen.getByRole("article");
    expect(within(item).getByText("惩罚中 · 错误 2 次")).toBeInTheDocument();
    fireEvent.click(within(item).getByRole("button", { name: "解除惩罚" }));
    fireEvent.click(screen.getByRole("button", { name: "确认解除" }));

    expect(
      JSON.parse(window.localStorage.getItem(key) ?? "{}").attempt,
    ).toMatchObject({
      status: "incorrect",
      penaltyEndsAt: null,
    });
    expect(window.localStorage.getItem("another-app-token")).toBe("keep");
    expect(screen.getByRole("status")).toHaveTextContent("已解除 1 条惩罚记录");
  });

  it("requires confirmation before deleting an exact record", () => {
    renderPage();
    const item = screen.getByRole("article");
    fireEvent.click(within(item).getByRole("button", { name: "删除记录" }));

    expect(window.localStorage.getItem(key)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));
    expect(window.localStorage.getItem(key)).toBeNull();
    expect(window.localStorage.getItem("another-app-token")).toBe("keep");
    expect(screen.getByText("当前范围没有记录")).toBeInTheDocument();
  });
});
