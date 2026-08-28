/** Dev-only visual fixture. Not referenced by the production entry or build. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { gameApi } from "../src/api/game.client";
import { ThemeProvider } from "../src/components/ui/ThemeProvider";
import { OverlayProvider } from "../src/components/ui/OverlayProvider";
import { GameContext } from "../src/features/game/useGame";
import { GameDashboard } from "../src/features/game/pages/GameDashboard";
import { GameProfilePage } from "../src/features/game/pages/GameProfilePage";
import { GameRewardsPage } from "../src/features/game/pages/GameRewardsPage";
import { GameNotificationsPage } from "../src/features/game/pages/GameNotificationsPage";
import { GamePlayView } from "../src/features/game/GamePlayPage";
import { LetterExperience } from "../src/features/letter/LetterExperience";
import { desktopAssignment, desktopLetter } from "./desktop-preview-data";
import { imageAssignment } from "./question-image-fixtures";
import { GameLoadingScreen } from "../src/features/game/components/GameLoadingScreen";
import {
  makeAssignment,
  makeNotifications,
  makePlayer,
  makeRewards,
} from "../src/test/game-fixtures";
import "../src/index.css";

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
                <Route path="/" element={<GameDashboard />} />
                <Route path="/profile" element={<GameProfilePage />} />
                <Route path="/rewards" element={<GameRewardsPage />} />
                <Route
                  path="/notifications"
                  element={<GameNotificationsPage />}
                />
                <Route
                  path="/play/preview-images"
                  element={<GamePlayView assignment={imageAssignment} />}
                />
                <Route
                  path="/play/:id"
                  element={<GamePlayView assignment={desktopAssignment} />}
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
createRoot(document.getElementById("root")!).render(<Preview />);
