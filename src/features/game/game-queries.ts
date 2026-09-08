import { useQuery } from "@tanstack/react-query";
import { gameApi } from "@/api/game.client";
import { useGame } from "@/features/game/useGame";

export const gameKeys = {
  assignments: (playerId: string) => ["game", playerId, "assignments"] as const,
  rewards: (playerId: string) => ["game", playerId, "rewards"] as const,
  notifications: (playerId: string) =>
    ["game", playerId, "notifications"] as const,
};

export function useAssignments() {
  const { player } = useGame();
  return useQuery({
    queryKey: gameKeys.assignments(player.id),
    queryFn: ({ signal }) => gameApi.assignments(signal),
    refetchInterval: 5000,
  });
}
export function useRewards() {
  const { player } = useGame();
  return useQuery({
    queryKey: gameKeys.rewards(player.id),
    queryFn: ({ signal }) => gameApi.rewards(signal),
    refetchInterval: 5000,
  });
}
export function useGameNotifications() {
  const { player } = useGame();
  return useQuery({
    queryKey: gameKeys.notifications(player.id),
    queryFn: ({ signal }) => gameApi.notifications(signal),
    refetchInterval: 5000,
  });
}
