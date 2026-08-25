import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { ApiError } from "../api/errors";
import { ClearCachePage } from "../features/cache/ClearCachePage";
import { LetterPage } from "../features/letter/LetterPage";
import { QuestEntryPage } from "../features/quest/QuestEntryPage";
import { OverlayProvider } from "../components/ui/OverlayProvider";
import { ToastProvider } from "../components/ui/ToastProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (
          error instanceof ApiError &&
          (error.kind === "contract" ||
            error.kind === "cancelled" ||
            (error.kind === "http" &&
              Boolean(error.status && error.status < 500)))
        )
          return false;
        return failureCount < 2;
      },
    },
  },
});
const router = createBrowserRouter(
  [
    { path: "/", element: <QuestEntryPage /> },
    { path: "/letter", element: <LetterPage /> },
    { path: "/clearCache", element: <ClearCachePage /> },
    { path: "*", element: <QuestEntryPage /> },
  ],
  { basename: import.meta.env.BASE_URL },
);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <OverlayProvider>
          <RouterProvider router={router} />
        </OverlayProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
