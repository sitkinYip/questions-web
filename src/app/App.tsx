import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { GameApiError } from "../api/game.client";
import { OverlayProvider } from "../components/ui/OverlayProvider";
import { ToastProvider } from "../components/ui/ToastProvider";
import { resolveAppBasename } from "../shared/navigation/app-base";
import { ThemeProvider } from "../components/ui/ThemeProvider";
import { GameGate } from "../features/game/GameContext";
import { GameLoginPage } from "../features/game/pages/GameLoginPage";
import { GameDashboard } from "../features/game/pages/GameDashboard";
import { GameProfilePage } from "../features/game/pages/GameProfilePage";
import { GameRewardsPage } from "../features/game/pages/GameRewardsPage";
import { GameNotificationsPage } from "../features/game/pages/GameNotificationsPage";
import { GamePlayPage } from "../features/game/GamePlayPage";
import { GameNarrativePage } from "../features/game/GameNarrativePage";

const appBasename = resolveAppBasename(
  import.meta.env.BASE_URL,
  window.location.pathname,
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (
          error instanceof GameApiError &&
          (error.code === "CONTRACT_ERROR" ||
            error.code === "CANCELLED" ||
            Boolean(error.status && error.status < 500))
        )
          return false;
        return failureCount < 2;
      },
    },
  },
});
const router = createBrowserRouter(
  [
    { path: "/login", element: <GameLoginPage /> },
    {
      path: "/",
      element: <GameGate />,
      children: [
        { index: true, element: <GameDashboard /> },
        { path: "profile", element: <GameProfilePage /> },
        { path: "rewards", element: <GameRewardsPage /> },
        { path: "notifications", element: <GameNotificationsPage /> },
        { path: "play/:id", element: <GamePlayPage /> },
        { path: "play/:id/content/:contentId", element: <GameNarrativePage /> },
      ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
  ],
  { basename: appBasename },
);

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <OverlayProvider>
            <RouterProvider router={router} />
          </OverlayProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
