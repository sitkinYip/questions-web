import { GameLayout } from "@/features/game/components/GameLayout";
/** Dev-only visual fixture. Not referenced by the production entry or build. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { gameApi } from "@/api/game.client";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { OverlayProvider } from "@/components/ui/OverlayProvider";
import { GameContext } from "@/features/game/useGame";
import { GameDashboard } from "@/features/game/pages/GameDashboard";
import { GameProfilePage } from "@/features/game/pages/GameProfilePage";
import { GameRewardsPage } from "@/features/game/pages/GameRewardsPage";
import { GameNotificationsPage } from "@/features/game/pages/GameNotificationsPage";
import { GamePlayView } from "@/features/game/GamePlayPage";
import { LetterExperience } from "@/features/letter/LetterExperience";
import { RankUpDialog } from "@/features/rank/RankUpDialog";
import {
  desktopAssignment,
  desktopLetter,
  desktopNarrativeAssignment,
} from "@e2e/desktop-preview-data";
import { imageAssignment } from "@e2e/question-image-fixtures";
import { GameLoadingScreen } from "@/features/game/components/GameLoadingScreen";
import {
  makeAssignment,
  makeNotifications,
  makePlayer,
  makeRewards,
} from "@/test/game-fixtures";
import "@/index.css";

if (!import.meta.env.DEV)
  throw new Error("Visual fixtures are development-only.");
let fixturePlayer = makePlayer();
const notices = makeNotifications();
gameApi.assignments = async () => ({
  items: [
    makeAssignment(),
    makeAssignment({
      id: "preview-next",
      title: "迷雾来信",
      description: "一封没有署名的来信，把下一段旅程交到了你手中。",
      status: "assigned",
      startedAt: "",
      completedLevels: 0,
      totalLevels: 4,
    }),
  ],
});
gameApi.rewards = async () => ({ items: makeRewards() });
gameApi.notifications = async () => ({ items: notices });
gameApi.readNotification = async (id) => {
  const note = notices.find((item) => item.id === id);
  if (note) note.readAt = new Date().toISOString();
  return {};
};
gameApi.profile = async (form) => {
  fixturePlayer = {
    ...fixturePlayer,
    displayName: String(form.get("displayName")),
  };
  return fixturePlayer;
};
gameApi.changePassword = async () => fixturePlayer;
const client = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export function Preview() {
  const [player, setPlayer] = useState(fixturePlayer);
  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <OverlayProvider>
          <GameContext.Provider
            value={{
              player,
              setPlayer,
              logout: () => window.location.assign("/login"),
            }}
          >
            <MemoryRouter
              initialEntries={[
                new URLSearchParams(window.location.search).get("screen") ||
                  "/",
              ]}
            >
              <Routes>
                <Route path="/loading" element={<GameLoadingScreen />} />
                <Route
                  path="/loading/player"
                  element={<GameLoadingScreen scene="player" />}
                />
                <Route
                  path="/loading/narrative"
                  element={<GameLoadingScreen scene="narrative" />}
                />
                <Route element={<GameLayout />}>
                  <Route path="/" element={<GameDashboard />} />
                  <Route path="/profile" element={<GameProfilePage />} />
                  <Route path="/rewards" element={<GameRewardsPage />} />
                  <Route
                    path="/notifications"
                    element={<GameNotificationsPage />}
                  />
                </Route>
                <Route
                  path="/play/preview-images"
                  element={<GamePlayView assignment={imageAssignment} />}
                />
                <Route
                  path="/play/preview-narrative"
                  element={
                    <GamePlayView assignment={desktopNarrativeAssignment} />
                  }
                />
                <Route
                  path="/rank-preview"
                  element={
                    <>
                      <GamePlayView assignment={desktopAssignment} />
                      <RankUpDialog
                        rank={{
                          code: "07",
                          name: "星穹领航者",
                          isSpecial: false,
                          numericValue: 7,
                        }}
                        onClose={() => undefined}
                      />
                    </>
                  }
                />
                <Route
                  path="/play/:id"
                  element={<GamePlayView assignment={desktopAssignment} />}
                />
                <Route
                  path="/play/:id/content/:contentId"
                  element={
                    <LetterExperience
                      letter={desktopLetter}
                      returnTo="/e2e/preview.html?screen=/play/preview-narrative"
                    />
                  }
                />
                <Route
                  path="/letter"
                  element={
                    <LetterExperience
                      letter={desktopLetter}
                      returnTo="/e2e/preview.html?screen=/play/preview-journey"
                    />
                  }
                />
              </Routes>
            </MemoryRouter>
          </GameContext.Provider>
        </OverlayProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
const previewRoot = createRoot(document.getElementById("root")!);
previewRoot.render(<Preview />);
if (import.meta.hot) import.meta.hot.dispose(() => previewRoot.unmount());
