import { GamePageHeading } from "../components/GameLayout";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "../components/GameState";
import { useGameNotifications } from "../game-queries";
import { NotificationLetter } from "../components/NotificationLetter";
import { useDesktopLayout } from "../../../shared/layout/useDesktopLayout";
import { DesktopInbox } from "../desktop/DesktopInbox";

export function GameNotificationsPage() {
  const isDesktop = useDesktopLayout();
  const query = useGameNotifications();
  const unread = query.data?.items.filter((item) => !item.readAt).length ?? 0;
  return (
    <>
      <GamePageHeading eyebrow="旅途来信" title="旅途中，有人来信。">
        下一条线索，也许就在这里。
        {unread > 0 ? `你有 ${unread} 封新来信。` : ""}
      </GamePageHeading>
      {query.isPending && <GameLoading label="正在整理旅途来信…" />}
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
        <GameEmptyState title="此刻，信箱里只有星光。">
          暂时没有消息。新的来信会自动送到，不必守在这里等。
        </GameEmptyState>
      )}
    </>
  );
}
