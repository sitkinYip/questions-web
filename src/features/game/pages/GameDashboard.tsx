import { WorkspaceTabs } from "@/components/ui/WorkspaceTabs";
import { uiCopy } from "@/config/ui-copy";
import { useEffect, useState } from "react";
import { Tabs } from "radix-ui";
import { CelestialAtlas } from "@/components/effects/CelestialAtlas";
import { GamePageHeading } from "@/features/game/components/GameLayout";
import { PlayerPassport } from "@/features/game/components/PlayerPassport";
import { AssignmentCard } from "@/features/game/components/AssignmentCard";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "@/features/game/components/GameState";
import { useAssignments } from "@/features/game/game-queries";
import { useGame } from "@/features/game/useGame";

export function GameDashboard() {
  const { player } = useGame();
  const query = useAssignments();
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
    <>
      <div className="game-lobby">
        <div className="game-lobby__journeys">
          <div className="game-lobby__intro">
            <CelestialAtlas compact />
            <GamePageHeading
              eyebrow={uiCopy.gameDashboard.eyebrow}
              title={uiCopy.gameDashboard.title}
            >
              {uiCopy.gameDashboard.description}
            </GamePageHeading>
          </div>
          <WorkspaceTabs defaultValue="current" className="game-tabs">
            <Tabs.List
              className="game-tabs__list"
              aria-label={uiCopy.gameDashboard.tabsLabel}
            >
              <Tabs.Trigger value="current">
                {uiCopy.gameDashboard.upcoming}
                <span>{current.length}</span>
              </Tabs.Trigger>
              <Tabs.Trigger value="history">
                {uiCopy.gameDashboard.history}
                <span>{history.length}</span>
              </Tabs.Trigger>
            </Tabs.List>
            {(
              [
                { value: "current", items: current },
                { value: "history", items: history },
              ] as const
            ).map(({ value, items }) => (
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
                <div className="chapter-list">
                  {items.map((item, index) => (
                    <AssignmentCard
                      key={item.id}
                      item={item}
                      rank={player.level.order}
                      now={now}
                      index={index}
                    />
                  ))}
                </div>
              </Tabs.Content>
            ))}
          </WorkspaceTabs>
          <p className="game-sync-note">{uiCopy.gameDashboard.syncHint}</p>
        </div>
        <aside className="game-lobby__passport">
          <PlayerPassport editable />
        </aside>
      </div>
    </>
  );
}
