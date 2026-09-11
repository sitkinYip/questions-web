import { GameHeaderView } from "./components/GameHeaderView";
import { uiCopy } from "@/config/ui-copy";
import { GameSyncMessage } from "@/features/game/components/GameRequestFeedback";
import { useEffect, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { z } from "zod";
import {
  isFatalGameError,
  authState,
  gameApi,
  gameRequest,
  pocketBaseUrl,
} from "@/api/game.client";
import { GameSidebar } from "@/features/game/GameSidebar";
import { Button } from "@/components/ui/Button";
import { PasswordPage } from "@/features/game/pages/PasswordPage";
import { GameFailure } from "@/features/game/components/GameState";
import { GameLoadingScreen } from "@/features/game/components/GameLoadingScreen";

import { GameContext, useGame } from "@/features/game/useGame";
export { GameFailure } from "@/features/game/components/GameState";
export function GameGate() {
  const auth = useSyncExternalStore(authState.subscribe, authState.get);
  const queryClient = useQueryClient();
  const location = useLocation();
  const playerId = auth?.playerId;
  const cache = queryClient.getQueryCache();
  const hasSyncError = useSyncExternalStore(
    (notify) => cache.subscribe(notify),
    () =>
      cache
        .findAll({ queryKey: ["game", playerId] })
        .some(
          (item) =>
            item.getObserversCount() > 0 &&
            item.state.status === "error" &&
            item.state.data !== undefined &&
            !isFatalGameError(item.state.error),
        ),
  );
  useEffect(
    () => () => {
      if (playerId) {
        void queryClient.cancelQueries({ queryKey: ["game", playerId] });
        queryClient.removeQueries({ queryKey: ["game", playerId] });
      }
    },
    [playerId, queryClient],
  );
  const query = useQuery({
    queryKey: ["game", playerId, "me"],
    queryFn: ({ signal }) => gameApi.me(signal),
    enabled: Boolean(auth),
    retry: false,
    refetchInterval: 5000,
  });
  const file = useQuery({
    queryKey: ["game", playerId, "file-token"],
    queryFn: () =>
      gameRequest("/api/files/token", {
        publicPath: true,
        method: "POST",
        body: {},
        schema: z.object({ token: z.string() }),
      }),
    enabled: Boolean(auth && query.data?.avatar),
    staleTime: 60000,
    refetchInterval: 60000,
  });
  if (!auth)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (query.isPending) return <GameLoadingScreen scene="player" />;
  if (query.isError && (!query.data || isFatalGameError(query.error)))
    return (
      <main className="game-shell">
        <GameFailure error={query.error} retry={() => void query.refetch()} />
        <Button onClick={() => authState.set(null)}>
          {uiCopy.gameContext.loginAgain}
        </Button>
      </main>
    );
  const player = query.data!;
  const avatarUrl =
    player.avatar && file.data
      ? `${pocketBaseUrl}/api/files/game_players/${encodeURIComponent(player.id)}/${encodeURIComponent(player.avatar)}?token=${encodeURIComponent(file.data.token)}`
      : undefined;
  return (
    <GameContext.Provider
      value={{
        player,
        avatarUrl,
        setPlayer: (value) =>
          queryClient.setQueryData(["game", player.id, "me"], value),
        logout: () => authState.set(null),
      }}
    >
      <div key={player.id}>
        <GameSyncMessage active={hasSyncError} />
        {player.mustChangePassword ? <PasswordPage forced /> : <Outlet />}
      </div>
    </GameContext.Provider>
  );
}
export function GameHeader({
  progress,
}: {
  progress?: { completed: number; total: number };
}) {
  const { player } = useGame();
  return (
    <GameHeaderView
      player={player}
      progress={progress}
      navigation={<GameSidebar />}
    />
  );
}
