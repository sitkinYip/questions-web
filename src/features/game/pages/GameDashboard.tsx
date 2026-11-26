import { WorkspaceTabs } from "@/components/ui/WorkspaceTabs";
import { uiCopy } from "@/config/ui-copy";
import { useEffect, useState, type CSSProperties } from "react";
import { Tabs } from "radix-ui";
import { AssignmentCard } from "@/features/game/components/AssignmentCard";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "@/features/game/components/GameState";
import { useAssignments } from "@/features/game/game-queries";
import { GameUnreadHeading } from "@/features/game/components/GameUnreadHeading";
import {
  unreadAssignments,
  useGameSeenActivity,
  useMarkGameActivitySeen,
} from "@/features/game/game-unread";
import { useGame } from "@/features/game/useGame";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";

export function GameDashboard() {
  const isDesktop = useDesktopLayout();
  const { player } = useGame();
  const query = useAssignments();
  const unread = unreadAssignments(query.data?.items, useGameSeenActivity());
  const markSeen = useMarkGameActivitySeen();
  const [tab, setTab] = useState<"current" | "history">("current");
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const current =
    query.data?.items.filter(
      (item) => item.status === "assigned" || item.status === "active",
    ) ?? [];
  const history =
    query.data?.items.filter(
      (item) => item.status === "completed" || item.status === "cancelled",
    ) ?? [];

  return (
    <div className="game-lobby">
      <div className="game-lobby__journeys">
        <WorkspaceTabs
          value={tab}
          onValueChange={(value) =>
            setTab(value === "history" ? "history" : "current")
          }
          className="game-tabs"
        >
          <div className="game-page-head">
            <GameUnreadHeading
              title={uiCopy.gameNavigation.dashboard}
              unread={unread.size}
              onClear={() => markSeen("assignments", [...unread])}
            />
            <Tabs.List
              className="game-segment"
              aria-label={uiCopy.gameDashboard.tabsLabel}
              style={
                {
                  "--seg-index": tab === "current" ? 0 : 1,
                } as CSSProperties
              }
            >
              <span className="game-segment__thumb" aria-hidden="true" />
              <Tabs.Trigger value="current">
                {uiCopy.gameDashboard.upcoming}
              </Tabs.Trigger>
              <Tabs.Trigger value="history">
                {uiCopy.gameDashboard.history}
              </Tabs.Trigger>
            </Tabs.List>
          </div>

          {(
            [
              { value: "current", items: current },
              { value: "history", items: history },
            ] as const
          ).map(({ value, items }) => {
            const useDesktopBento =
              isDesktop && value === "current" && items.length > 0;
            return (
              <Tabs.Content
                key={value}
                value={value}
                className="game-tabs__content"
              >
                {query.isPending && <GameLoading />}
                {query.isError && (
                  <GameFailure
                    error={query.error}
                    retry={() => void query.refetch()}
                  />
                )}
                {query.isSuccess && !items.length && (
                  <GameEmptyState
                    title={
                      value === "current"
                        ? uiCopy.gameDashboard.upcomingEmptyTitle
                        : uiCopy.gameDashboard.historyEmptyTitle
                    }
                  >
                    {value === "current"
                      ? uiCopy.gameDashboard.upcomingEmptyDescription
                      : uiCopy.gameDashboard.historyEmptyDescription}
                  </GameEmptyState>
                )}

                {useDesktopBento ? (
                  <div
                    className={`chapter-bento${items.length === 1 ? " chapter-bento--single" : ""}`}
                  >
                    <AssignmentCard
                      key={items[0].id}
                      item={items[0]}
                      rank={player.level.order}
                      now={now}
                      index={0}
                      hero
                      unread={unread.has(items[0].id)}
                    />
                    {items.length > 1 && (
                      <div className="chapter-bento__side">
                        {items.slice(1).map((item, idx) => (
                          <AssignmentCard
                            key={item.id}
                            item={item}
                            rank={player.level.order}
                            now={now}
                            index={idx + 1}
                            unread={unread.has(item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  items.length > 0 && (
                    <div className="chapter-list">
                      {items.map((item, index) => (
                        <AssignmentCard
                          key={item.id}
                          item={item}
                          rank={player.level.order}
                          now={now}
                          index={index}
                          unread={unread.has(item.id)}
                        />
                      ))}
                    </div>
                  )
                )}
              </Tabs.Content>
            );
          })}
        </WorkspaceTabs>
      </div>
    </div>
  );
}
