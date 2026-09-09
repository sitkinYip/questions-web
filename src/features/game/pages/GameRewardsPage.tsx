import { RewardCard } from "@/features/game/components/RewardCard";
import { uiCopy } from "@/config/ui-copy";
import { Link } from "react-router-dom";
import { GamePageHeading } from "@/features/game/components/GameLayout";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "@/features/game/components/GameState";
import { useRewards } from "@/features/game/game-queries";

export function GameRewardsPage() {
  const query = useRewards();
  return (
    <>
      <GamePageHeading
        eyebrow={uiCopy.gameRewardsPage.eyebrow}
        title={uiCopy.gameRewardsPage.title}
      >
        {uiCopy.gameRewardsPage.description}
      </GamePageHeading>
      {query.isPending && (
        <GameLoading label={uiCopy.gameRewardsPage.loading} />
      )}
      {query.isError && (
        <GameFailure error={query.error} retry={() => void query.refetch()} />
      )}
      <div className="reward-grid">
        {query.data?.items.map((item) => (
          <RewardCard key={item.id} item={item} />
        ))}
      </div>
      {query.isSuccess && query.data.items.length === 0 && (
        <GameEmptyState
          title={uiCopy.gameRewardsPage.emptyTitle}
          action={
            <Link className="game-action-link" to="/">
              {uiCopy.gameRewardsPage.explore}
            </Link>
          }
        >
          {uiCopy.gameRewardsPage.emptyDescription}
        </GameEmptyState>
      )}
    </>
  );
}
