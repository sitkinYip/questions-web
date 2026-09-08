import { uiCopy } from "@/config/ui-copy";
import { GamePageHeading } from "@/features/game/components/GameLayout";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "@/features/game/components/GameState";
import { useGameNotifications } from "@/features/game/game-queries";
import { NotificationLetter } from "@/features/game/components/NotificationLetter";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";
import { DesktopInbox } from "@/features/game/desktop/DesktopInbox";

export function GameNotificationsPage() {
  const isDesktop = useDesktopLayout();
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
      {query.isPending && (
        <GameLoading label={uiCopy.gameNotificationsPage.loading} />
      )}
      {query.isError && (
        <GameFailure error={query.error} retry={() => void query.refetch()} />
      )}
      {isDesktop && !!query.data?.items.length ? (
        <DesktopInbox notes={query.data.items} />
      ) : (
        <div className="notification-letters">
          {query.data?.items.map((note) => (
            <NotificationLetter key={note.id} note={note} />
          ))}
        </div>
      )}
      {query.isSuccess && !query.data.items.length && (
        <GameEmptyState title={uiCopy.gameNotificationsPage.emptyTitle}>
          {uiCopy.gameNotificationsPage.emptyDescription}
        </GameEmptyState>
      )}
    </>
  );
}
