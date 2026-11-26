import { useState, type CSSProperties } from "react";
import { Tabs } from "radix-ui";
import { Link } from "react-router-dom";
import { RewardCard } from "@/features/game/components/RewardCard";
import { uiCopy } from "@/config/ui-copy";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "@/features/game/components/GameState";
import { useRewards } from "@/features/game/game-queries";
import { GameUnreadHeading } from "@/features/game/components/GameUnreadHeading";
import {
  unreadRewards,
  useGameSeenActivity,
  useMarkGameActivitySeen,
} from "@/features/game/game-unread";

export function GameRewardsPage() {
  const query = useRewards();
  const unread = unreadRewards(query.data?.items, useGameSeenActivity());
  const markSeen = useMarkGameActivitySeen();
  const [tab, setTab] = useState<"unclaimed" | "claimed">("unclaimed");

  const items = query.data?.items ?? [];
  const unclaimed = items.filter((item) => item.status === "available");
  const claimed = items.filter((item) => item.status !== "available");

  return (
    <Tabs.Root
      value={tab}
      onValueChange={(value) =>
        setTab(value === "claimed" ? "claimed" : "unclaimed")
      }
      className="rewards-tabs"
    >
      <div className="game-page-head">
        <GameUnreadHeading
          title={uiCopy.gameNavigation.rewards}
          unread={unread.size}
          onClear={() => markSeen("rewards", [...unread])}
        />
        <Tabs.List
          className="game-segment"
          aria-label="收藏状态"
          style={
            {
              "--seg-index": tab === "unclaimed" ? 0 : 1,
            } as CSSProperties
          }
        >
          <span className="game-segment__thumb" aria-hidden="true" />
          <Tabs.Trigger value="unclaimed">待领</Tabs.Trigger>
          <Tabs.Trigger value="claimed">已领</Tabs.Trigger>
        </Tabs.List>
      </div>

      {query.isPending && (
        <GameLoading label={uiCopy.gameRewardsPage.loading} />
      )}
      {query.isError && (
        <GameFailure error={query.error} retry={() => void query.refetch()} />
      )}

      {(
        [
          { value: "unclaimed", list: unclaimed },
          { value: "claimed", list: claimed },
        ] as const
      ).map(({ value, list }) => (
        <Tabs.Content key={value} value={value} className="game-tabs__content">
          {list.length > 0 && (
            <div className="reward-grid">
              {list.map((item) => (
                <RewardCard
                  key={item.id}
                  item={item}
                  unread={unread.has(item.id)}
                />
              ))}
            </div>
          )}
          {query.isSuccess && list.length === 0 && (
            <GameEmptyState
              title={
                items.length === 0
                  ? uiCopy.gameRewardsPage.emptyTitle
                  : value === "unclaimed"
                    ? "暂无待领收藏"
                    : "暂无已领收藏"
              }
              action={
                items.length === 0 ? (
                  <Link className="game-action-link" to="/">
                    {uiCopy.gameRewardsPage.explore}
                  </Link>
                ) : undefined
              }
            >
              {items.length === 0
                ? uiCopy.gameRewardsPage.emptyDescription
                : value === "unclaimed"
                  ? "所有已获得的收藏都已收好，可切换至「已领」查看。"
                  : "完成领取后的纪念收藏会收录在这里。"}
            </GameEmptyState>
          )}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
