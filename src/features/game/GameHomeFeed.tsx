import type { ReactNode } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { gameNavigation } from "@/features/game/game-navigation";
import {
  GameHomeFeedContext,
  useGameHomePolling,
  useLegacyGameHomePolling,
} from "@/features/game/game-queries";
import { useGame } from "@/features/game/useGame";

export function GameHomeFeed({ children }: { children: ReactNode }) {
  const { player } = useGame();
  const { pathname } = useLocation();
  const inMainShell = gameNavigation.some(({ to }) => matchPath(to, pathname));
  const aggregate = useGameHomePolling(player.id, inMainShell);
  useLegacyGameHomePolling(player.id, inMainShell && !aggregate);
  const feed = inMainShell ? (aggregate ? "aggregate" : "legacy") : null;

  return (
    <GameHomeFeedContext.Provider value={feed}>
      {children}
    </GameHomeFeedContext.Provider>
  );
}
