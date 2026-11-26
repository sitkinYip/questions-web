import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { uiCopy } from "@/config/ui-copy";
import { SparkleIcon } from "@phosphor-icons/react";
import type { GameReward } from "@/api/game.contracts";
import { RichContent } from "@/features/content/RichContent";
import { formatGameDate } from "@/features/game/game-presentation";
import { useImmersiveLight } from "@/design/useImmersiveLight";

export function RewardCard({
  item,
  unread = false,
}: {
  item: GameReward;
  unread?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const available = item.status === "available";
  const light = useImmersiveLight(item.status !== "voided");
  const statusLabel = {
    available: uiCopy.gameRewardsPage.available,
    redeemed: uiCopy.gameRewardsPage.redeemed,
    voided: uiCopy.gameRewardsPage.voided,
  }[item.status];

  return (
    <>
      <article className="reward-card" data-state={item.status} {...light}>
        <button
          type="button"
          className="reward-card__trigger"
          onClick={() => setOpen(true)}
          aria-label={`查看${item.snapshot.name}详情`}
          aria-description={unread ? uiCopy.gameUnread.reward : undefined}
        >
          <div className="reward-card__art">
            {item.snapshot.image ? (
              <img
                src={item.snapshot.image}
                alt={item.snapshot.name}
                loading="lazy"
              />
            ) : (
              <SparkleIcon
                weight={available ? "duotone" : "regular"}
                aria-hidden="true"
              />
            )}
          </div>
          <div className="reward-card__foot">
            <div className="game-unread-title">
              <h2>{item.snapshot.name}</h2>
              {unread && (
                <span className="game-unread-dot" aria-hidden="true" />
              )}
            </div>
            <span className="reward-card__qty tabular-nums">
              ×{item.quantity}
            </span>
          </div>
          <span className="sr-only">{statusLabel}</span>
        </button>
      </article>
      <Sheet
        overlayId={`reward-${item.id}`}
        open={open}
        onOpenChange={setOpen}
        title={item.snapshot.name}
        className="reward-details"
        density="compact"
        side="right"
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
        {available && item.claimDetails && (
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
