import { useCallback } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GameAssignmentSummary, GameReward } from "@/api/game.contracts";
import { useGame } from "@/features/game/useGame";
import {
  readGameSeenActivity,
  writeGameSeenActivity,
  type GameActivityKind,
  type GameSeenActivity,
} from "@/infrastructure/storage/game-unread.repository";

const seenActivityQueryKey = (playerId: string) =>
  ["game", playerId, "seen-activity"] as const;
const emptySeenActivity: GameSeenActivity = { assignments: [], rewards: [] };

export function useGameSeenActivity() {
  const { player } = useGame();
  const seen = useQuery({
    queryKey: seenActivityQueryKey(player.id),
    queryFn: skipToken,
    initialData: () => readGameSeenActivity(player.id),
    staleTime: Infinity,
  });
  return seen.data ?? emptySeenActivity;
}

export function useMarkGameActivitySeen() {
  const { player } = useGame();
  const client = useQueryClient();
  const playerId = player.id;

  return useCallback(
    (kind: GameActivityKind, ids: readonly string[]) => {
      if (!ids.length) return;
      const key = seenActivityQueryKey(playerId);
      const memory = client.getQueryData<GameSeenActivity>(key);
      if (memory && ids.every((id) => memory[kind].includes(id))) return;
      const stored = readGameSeenActivity(playerId);
      const next = {
        assignments: [
          ...new Set([...stored.assignments, ...(memory?.assignments ?? [])]),
        ],
        rewards: [...new Set([...stored.rewards, ...(memory?.rewards ?? [])])],
      };
      next[kind] = [...new Set([...next[kind], ...ids])];
      writeGameSeenActivity(playerId, next);
      client.setQueryData(key, next);
    },
    [client, playerId],
  );
}

export function unreadAssignments(
  items: readonly GameAssignmentSummary[] | undefined,
  seen: GameSeenActivity,
) {
  const visited = new Set(seen.assignments);
  return new Set(
    (items ?? [])
      .filter((item) => item.status === "assigned" && !visited.has(item.id))
      .map((item) => item.id),
  );
}

export function unreadRewards(
  items: readonly GameReward[] | undefined,
  seen: GameSeenActivity,
) {
  const dismissed = new Set(seen.rewards);
  return new Set(
    (items ?? [])
      .filter((item) => item.status === "available" && !dismissed.has(item.id))
      .map((item) => item.id),
  );
}
