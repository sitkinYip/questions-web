import { uiCopy } from "@/config/ui-copy";
import type { GamePlayer } from "@/api/game.contracts";
import { StarFourIcon } from "@phosphor-icons/react";
import { CelestialAtlas } from "@/components/effects/CelestialAtlas";
import {
  ExperienceMeter,
  PlayerAvatar,
} from "@/features/game/components/PlayerPassport";

/** One identity layout; its ornament and scale adapt to the sheet's available height. */
export function GameSidebarIdentity({
  player,
  avatarUrl,
}: {
  player: GamePlayer;
  avatarUrl?: string;
}) {
  return (
    <section
      className="game-sidebar-identity"
      aria-label={uiCopy.gameSidebarIdentity.label}
    >
      <div className="game-sidebar-identity__stamp" aria-hidden="true">
        <StarFourIcon weight="duotone" />
        <span>{uiCopy.gameSidebarIdentity.title}</span>
      </div>
      <div className="game-sidebar-identity__player">
        <div className="game-sidebar-identity__crest">
          <CelestialAtlas compact />
          <PlayerAvatar name={player.displayName} url={avatarUrl} />
        </div>
        <div>
          <h3 title={player.displayName}>{player.displayName}</h3>
          <p title={`${player.level.name} · Lv.${player.level.order}`}>
            {uiCopy.gameSidebarIdentity.rank(
              player.level.name,
              player.level.order,
            )}
          </p>
        </div>
      </div>
      <ExperienceMeter player={player} compact />
    </section>
  );
}
