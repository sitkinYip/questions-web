import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { uiCopy } from "@/config/ui-copy";
import { SparkleIcon } from "@phosphor-icons/react";
import type { GameReward } from "@/api/game.contracts";
import { RichContent } from "@/features/content/RichContent";
import { formatGameDate } from "@/features/game/game-presentation";

export function RewardCard({ item }: { item: GameReward }) {
  const [open, setOpen] = useState(false);
  return (
    <>
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
          <Button
            variant="ghost"
            size="small"
            onClick={() => setOpen(true)}
            aria-label={`查看${item.snapshot.name}详情`}
          >
            查看详情 <span aria-hidden="true">↗</span>
          </Button>
        </div>
      </article>
      <Sheet
        overlayId={`reward-${item.id}`}
        open={open}
        onOpenChange={setOpen}
        title={item.snapshot.name}
        className="reward-details"
        density="compact"
        mobileSide="bottom"
      >
        {item.snapshot.image && (
          <RichContent source={`{{${item.snapshot.image}}}`} />
        )}
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
      </Sheet>
    </>
  );
}
