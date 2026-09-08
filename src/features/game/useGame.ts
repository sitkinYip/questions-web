import { createContext, useContext } from "react";
import type { GamePlayer } from "@/api/game.contracts";

export const GameContext = createContext<{
  player: GamePlayer;
  avatarUrl?: string;
  setPlayer: (player: GamePlayer) => void;
  logout: () => void;
} | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("Game context required");
  return context;
}
