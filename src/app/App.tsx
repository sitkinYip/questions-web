import { MediaPreviewProvider } from "@/features/media/MediaPreviewProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { OverlayProvider } from "@/components/ui/OverlayProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { resolveAppBasename } from "@/shared/navigation/app-base";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { GameGate } from "@/features/game/GameContext";
import { GameLoginPage } from "@/features/game/pages/GameLoginPage";
import { GameDashboard } from "@/features/game/pages/GameDashboard";
import { GameProfilePage } from "@/features/game/pages/GameProfilePage";
import { GameRewardsPage } from "@/features/game/pages/GameRewardsPage";
import { GameNotificationsPage } from "@/features/game/pages/GameNotificationsPage";
import { GamePlayPage } from "@/features/game/GamePlayPage";
import { GameNarrativePage } from "@/features/game/GameNarrativePage";

import { GameLayout } from "@/features/game/components/GameLayout";

const appBasename = resolveAppBasename(
  import.meta.env.BASE_URL,
  window.location.pathname,
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false, // The transport owns retries within a single Promise.
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
        {
          element: <GameLayout />,
          children: [
            { index: true, element: <GameDashboard /> },
            { path: "profile", element: <GameProfilePage /> },
            { path: "rewards", element: <GameRewardsPage /> },
            { path: "notifications", element: <GameNotificationsPage /> },
          ],
        },
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
            <MediaPreviewProvider>
              <RouterProvider router={router} />
            </MediaPreviewProvider>
          </OverlayProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
