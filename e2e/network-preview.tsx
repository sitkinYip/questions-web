/** Development-only UI demonstration; never imported by the production app. */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GameApiError, gameApi } from "@/api/game.client";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { OverlayProvider } from "@/components/ui/OverlayProvider";
import { AppToast } from "@/components/ui/Toast";
import { GameContext } from "@/features/game/useGame";
import { GamePlayView } from "@/features/game/GamePlayPage";
import { GameHeader } from "@/features/game/GameContext";
import { GameFailure } from "@/features/game/components/GameState";
import {
  GameRetryDialog,
  GameSyncMessage,
} from "@/features/game/components/GameRequestFeedback";
import { desktopAssignment } from "@e2e/desktop-preview-data";
import { makePlayer } from "@/test/game-fixtures";
import "@/index.css";
import "@e2e/network-preview.css";

if (!import.meta.env.DEV) throw new Error("Development preview only");
const params = new URLSearchParams(location.search);
const scene = params.get("scene") || "answer";
const player = makePlayer();
const client = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
// All data stays in this page; no live API requests or account changes.
gameApi.notifications = async () => ({ items: [] });
gameApi.assignments = async () => ({ items: [desktopAssignment] });
gameApi.rewards = async () => ({ items: [] });
gameApi.answer = async () => {
  throw new GameApiError("NETWORK_ERROR", "模拟连接中断");
};
gameApi.start = async () => {
  throw new GameApiError("NETWORK_ERROR", "模拟连接中断");
};

function Preview() {
  const [open, setOpen] = useState(true);
  const [replay, setReplay] = useState(0);
  const [pending, setPending] = useState(false);
  const [recovered, setRecovered] = useState(false);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      setPending(false);
      setOpen(false);
      setRecovered(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [pending]);
  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <OverlayProvider>
            <MemoryRouter>
              <GameContext.Provider
                value={{ player, setPlayer: () => {}, logout: () => {} }}
              >
                {scene === "fatal" && !recovered ? (
                  <main className="game-shell">
                    <GameHeader />
                    <GameFailure
                      error={
                        new GameApiError("SESSION_OFFLINE", "该场次已下线", 409)
                      }
                    />
                  </main>
                ) : (
                  <GamePlayView
                    assignment={
                      scene === "start"
                        ? { ...desktopAssignment, status: "assigned" }
                        : desktopAssignment
                    }
                  />
                )}
                {scene === "sync" && open && <GameSyncMessage key={replay} />}
                {(scene === "answer" || scene === "start") && (
                  <GameRetryDialog
                    open={open}
                    pending={pending}
                    action={scene}
                    onDismiss={() => setOpen(false)}
                    onRetry={() => setPending(true)}
                  />
                )}
                <AppToast
                  open={recovered}
                  onOpenChange={setRecovered}
                  title="模拟连接已恢复"
                  description="这里展示重试成功后的关闭效果，页面内容仍然保留。"
                />
                <nav
                  className="network-preview-controls"
                  aria-label="Mock 场景切换"
                >
                  <span>本地 Mock · 关闭弹窗后可切换</span>
                  {[
                    ["sync", "轻提示"],
                    ["answer", "提交重试"],
                    ["start", "开启重试"],
                    ["fatal", "场次下线"],
                  ].map(([value, label]) => (
                    <a
                      key={value}
                      aria-current={scene === value ? "page" : undefined}
                      href={`?scene=${value}&theme=${params.get("theme") || "dark"}`}
                    >
                      {label}
                    </a>
                  ))}
                  <a
                    href={`?scene=${scene}&theme=${params.get("theme") === "light" ? "dark" : "light"}`}
                  >
                    切换深浅主题
                  </a>
                  <button
                    onClick={() => {
                      setReplay((value) => value + 1);
                      setOpen(true);
                      setRecovered(false);
                    }}
                  >
                    重播效果
                  </button>
                </nav>
              </GameContext.Provider>
            </MemoryRouter>
          </OverlayProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
createRoot(document.getElementById("root")!).render(<Preview />);
