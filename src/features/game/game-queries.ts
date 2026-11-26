import { createContext, useContext } from "react";
import {
  queryOptions,
  useQuery,
  type QueryClient,
} from "@tanstack/react-query";
import { GameApiError, gameApi } from "@/api/game.client";
import type { GameHome } from "@/api/game.contracts";
import { useGame } from "@/features/game/useGame";

export const gameKeys = {
  home: (playerId: string) => ["game", playerId, "home"] as const,
  assignments: (playerId: string) => ["game", playerId, "assignments"] as const,
  rewards: (playerId: string) => ["game", playerId, "rewards"] as const,
  notifications: (playerId: string) =>
    ["game", playerId, "notifications"] as const,
};

const syncInterval = 5000;
export const GameHomeFeedContext = createContext<"aggregate" | "legacy" | null>(
  null,
);

export function gameHomeQuery(playerId: string) {
  return queryOptions({
    queryKey: gameKeys.home(playerId),
    queryFn: async ({ signal }): Promise<GameHome | null> => {
      try {
        return await gameApi.home(signal);
      } catch (error) {
        if (error instanceof GameApiError && error.status === 404) return null;
        throw error;
      }
    },
    staleTime: (query) => (query.state.data === null ? Infinity : 30_000),
  });
}

function dedicatedList<T extends keyof GameHome>(section: T, playerId: string) {
  return {
    queryKey: gameKeys[section](playerId),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      gameApi[section](signal) as Promise<GameHome[T]>,
  };
}

export function useLegacyGameHomePolling(playerId: string, enabled: boolean) {
  const options = { enabled, refetchInterval: syncInterval, staleTime: 0 };
  useQuery({ ...dedicatedList("assignments", playerId), ...options });
  useQuery({ ...dedicatedList("rewards", playerId), ...options });
  useQuery({ ...dedicatedList("notifications", playerId), ...options });
}

function useGameList<T extends keyof GameHome>(
  section: T,
  standalonePoll: boolean,
) {
  const { player } = useGame();
  const feed = useContext(GameHomeFeedContext);
  const aggregate = useQuery({
    ...gameHomeQuery(player.id),
    enabled: feed === "aggregate",
    select: (home) => home?.[section],
  });
  const dedicated = useQuery({
    ...dedicatedList(section, player.id),
    enabled: feed !== "aggregate",
    refetchInterval: feed === null && standalonePoll ? syncInterval : false,
  });
  return feed === "aggregate" ? aggregate : dedicated;
}

export const useAssignments = (standalonePoll = true) =>
  useGameList("assignments", standalonePoll);
export const useRewards = (standalonePoll = true) =>
  useGameList("rewards", standalonePoll);
export function useGameNotifications(poll = false) {
  return useGameList("notifications", poll);
}

export function invalidateGameList(
  client: QueryClient,
  playerId: string,
  section: keyof GameHome,
) {
  const home = gameKeys.home(playerId);
  const requests = [
    client.invalidateQueries({ queryKey: gameKeys[section](playerId) }),
  ];
  if (client.getQueryData<GameHome | null>(home) !== null) {
    requests.push(client.invalidateQueries({ queryKey: home }));
  }
  return Promise.all(requests);
}

export function useGameHomePolling(playerId: string, enabled: boolean) {
  const home = useQuery({
    ...gameHomeQuery(playerId),
    enabled,
    staleTime: (query) => (query.state.data === null ? Infinity : 0),
    refetchInterval: (query) =>
      query.state.data === null ? false : syncInterval,
  });
  return home.data !== null;
}
