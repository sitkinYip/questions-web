import { useEffect, useState } from "react";
import { Tabs } from "radix-ui";
import { CelestialAtlas } from "../../../components/effects/CelestialAtlas";
import { GamePageHeading } from "../components/GameLayout";
import { PlayerPassport } from "../components/PlayerPassport";
import { AssignmentCard } from "../components/AssignmentCard";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "../components/GameState";
import { useAssignments } from "../game-queries";
import { useGame } from "../useGame";

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
              eyebrow="你的冒险，从这里续写"
              title="下一段故事，等你落笔。"
            >
              有些答案，要亲自出发才能找到。
            </GamePageHeading>
          </div>
          <Tabs.Root defaultValue="current" className="game-tabs">
            <Tabs.List className="game-tabs__list" aria-label="场次分类">
              <Tabs.Trigger value="current">
                待赴之约 <span>{current.length}</span>
              </Tabs.Trigger>
              <Tabs.Trigger value="history">
                旅途回响 <span>{history.length}</span>
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
                        ? "下一场奇遇，正在酝酿。"
                        : "故事的第一页，还空着。"
                    }
                  >
                    {value === "current"
                      ? "还没有待玩场次。找现场工作人员领取你的旅程，新的邀请会自动出现在这里。"
                      : "完成一场冒险，就会在这里留下你的足迹。"}
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
          </Tabs.Root>
          <p className="game-sync-note">场次与进度会自动同步，放心去探索。</p>
        </div>
        <aside className="game-lobby__passport">
          <PlayerPassport editable />
        </aside>
      </div>
    </>
  );
}
