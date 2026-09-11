import { WorkspaceTabs } from "@/components/ui/WorkspaceTabs";
import { Tabs } from "radix-ui";
import { useSearchParams } from "react-router-dom";
import { StarLetters } from "@/features/mailbox/StarLetters";
import { uiCopy } from "@/config/ui-copy";
import { GamePageHeading } from "@/features/game/components/GameLayout";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "@/features/game/components/GameState";
import { useGameNotifications } from "@/features/game/game-queries";
import { NotificationLetter } from "@/features/game/components/NotificationLetter";

export function GameNotificationsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "stars" ? "stars" : "journey";
  const query = useGameNotifications();
  const unread = query.data?.items.filter((item) => !item.readAt).length ?? 0;
  return (
    <>
      <GamePageHeading
        eyebrow={uiCopy.gameNotificationsPage.eyebrow}
        title={uiCopy.gameNotificationsPage.title}
      >
        {uiCopy.gameNotificationsPage.description}
        {unread > 0 ? uiCopy.gameNotificationsPage.unreadCount(unread) : ""}
      </GamePageHeading>
      <WorkspaceTabs
        className="mailbox-panel"
        value={tab}
        onValueChange={(value) =>
          setParams(value === "stars" ? { tab: "stars" } : {}, {
            replace: true,
          })
        }
      >
        <Tabs.List
          className="mailbox-tabs"
          aria-label={uiCopy.gameNotificationsPage.eyebrow}
        >
          <Tabs.Trigger value="journey">
            {uiCopy.mailbox.journey}
            {unread > 0 ? ` · ${unread}` : ""}
          </Tabs.Trigger>
          <Tabs.Trigger value="stars">{uiCopy.mailbox.stars}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="journey">
          {query.isPending && (
            <GameLoading label={uiCopy.gameNotificationsPage.loading} />
          )}
          {query.isError && (
            <GameFailure
              error={query.error}
              retry={() => void query.refetch()}
            />
          )}
          <div className="notification-letters">
            {query.data?.items.map((note) => (
              <NotificationLetter key={note.id} note={note} />
            ))}
          </div>
          {query.isSuccess && !query.data.items.length && (
            <GameEmptyState title={uiCopy.gameNotificationsPage.emptyTitle}>
              {uiCopy.gameNotificationsPage.emptyDescription}
            </GameEmptyState>
          )}
        </Tabs.Content>
        <Tabs.Content value="stars">
          <StarLetters />
        </Tabs.Content>
      </WorkspaceTabs>
    </>
  );
}
