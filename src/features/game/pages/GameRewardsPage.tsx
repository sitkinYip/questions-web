import { uiCopy } from "@/config/ui-copy";
import { SparkleIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { GameReward } from "@/api/game.contracts";
import { RichContent } from "@/features/content/RichContent";
import { GamePageHeading } from "@/features/game/components/GameLayout";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "@/features/game/components/GameState";
import { formatGameDate } from "@/features/game/game-presentation";
import { useRewards } from "@/features/game/game-queries";

function RewardCard({ item }: { item: GameReward }) {
  return (
    <article className="reward-card" data-state={item.status}>
      <div className="reward-card__art">
        {item.snapshot.image ? (
          <img
            src={item.snapshot.image}
            alt={item.snapshot.name}
            loading="lazy"
          />
        ) : (
          <SparkleIcon weight="thin" aria-hidden="true" />
        )}
        <span>× {item.quantity}</span>
      </div>
      <div className="reward-card__body">
        <p
          className="game-status"
          data-tone={item.status === "available" ? "accent" : "muted"}
        >
          {
            {
              available: uiCopy.gameRewardsPage.available,
              redeemed: uiCopy.gameRewardsPage.redeemed,
              voided: uiCopy.gameRewardsPage.voided,
            }[item.status]
          }
        </p>
        <h2>{item.snapshot.name}</h2>
        <p className="game-muted">{item.snapshot.description}</p>
        {item.snapshot.publicInstructions && (
          <div className="reward-card__instructions">
            <h3>{uiCopy.gameRewardsPage.instructions}</h3>
            <RichContent source={item.snapshot.publicInstructions} />
          </div>
        )}
        {item.status === "available" && item.claimDetails && (
          <div className="game-claim-details">
            <h3>{uiCopy.gameRewardsPage.claimDetails}</h3>
            <RichContent source={item.claimDetails} />
          </div>
        )}
        {item.redeemedAt && (
          <p className="game-muted">
            {uiCopy.gameRewardsPage.claimedAt}{" "}
            <time dateTime={item.redeemedAt}>
              {formatGameDate(item.redeemedAt)}
            </time>
          </p>
        )}
      </div>
    </article>
  );
}
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
