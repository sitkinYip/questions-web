import { SparkleIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { GameReward } from "../../../api/game.contracts";
import { RichContent } from "../../content/RichContent";
import { GamePageHeading } from "../components/GameLayout";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "../components/GameState";
import { formatGameDate } from "../game-presentation";
import { useRewards } from "../game-queries";

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
              available: "礼物待领取",
              redeemed: "已领取 · 已核销",
              voided: "已失效",
            }[item.status]
          }
        </p>
        <h2>{item.snapshot.name}</h2>
        <p className="game-muted">{item.snapshot.description}</p>
        {item.snapshot.publicInstructions && (
          <div className="reward-card__instructions">
            <h3>领取指引</h3>
            <RichContent source={item.snapshot.publicInstructions} />
          </div>
        )}
        {item.status === "available" && item.claimDetails && (
          <div className="game-claim-details">
            <h3>你的领取线索</h3>
            <RichContent source={item.claimDetails} />
          </div>
        )}
        {item.redeemedAt && (
          <p className="game-muted">
            领取于{" "}
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
      <GamePageHeading eyebrow="冒险的收获" title="把奇遇，收入囊中。">
        那些解开的谜，留下了这些礼物。领取后记得请现场工作人员核销。
      </GamePageHeading>
      {query.isPending && <GameLoading label="正在打开你的收藏…" />}
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
          title="留个位置，给下一份惊喜。"
          action={
            <Link className="game-action-link" to="/">
              去探索新的故事
            </Link>
          }
        >
          还没有获得奖品。完成场次后，再来看看你的收获。
        </GameEmptyState>
      )}
    </>
  );
}
