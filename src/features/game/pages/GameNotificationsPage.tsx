import { useState, type CSSProperties } from "react";
import { WorkspaceTabs } from "@/components/ui/WorkspaceTabs";
import { Tabs } from "radix-ui";
import { useSearchParams } from "react-router-dom";
import { StarLetters } from "@/features/mailbox/StarLetters";
import { uiCopy } from "@/config/ui-copy";
import { Button } from "@/components/ui/Button";
import { RichContent } from "@/features/content/RichContent";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "@/features/game/components/GameState";
import { useGameNotifications } from "@/features/game/game-queries";
import { NotificationLetter } from "@/features/game/components/NotificationLetter";
import { GameUnreadHeading } from "@/features/game/components/GameUnreadHeading";
import { useGameReadNotifications } from "@/features/game/hooks/useGameReadNotifications";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";
import type { GameNotification } from "@/api/game.contracts";
import { formatGameDate } from "@/features/game/game-presentation";

function DesktopLetterReader({ note }: { note: GameNotification }) {
  const mutation = useGameReadNotifications();

  return (
    <article className="mailbox-reader" aria-label={note.title || "来信正文"}>
      <header className="mailbox-reader__head">
        <h2>
          {note.title || note.popupTitle || uiCopy.notificationLetter.newLetter}
        </h2>
        <time className="tabular-nums" dateTime={note.sentAt}>
          {formatGameDate(note.sentAt)}
        </time>
      </header>
      <div className="mailbox-reader__body notification-content">
        <RichContent source={note.content} />
      </div>
      {mutation.isError && (
        <GameFailure
          error={mutation.error}
          retry={() => mutation.mutate({ ids: [note.id] })}
        />
      )}
      <footer className="mailbox-reader__foot">
        {note.readAt ? (
          <span className="mailbox-reader__status">
            {uiCopy.notificationLetter.read}
          </span>
        ) : (
          <Button
            variant="primary"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ ids: [note.id] })}
          >
            {mutation.isPending
              ? uiCopy.notificationLetter.pending
              : note.buttonText || uiCopy.notificationLetter.accept}
          </Button>
        )}
      </footer>
    </article>
  );
}

export function GameNotificationsPage() {
  const isDesktop = useDesktopLayout();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "stars" ? "stars" : "journey";
  const query = useGameNotifications();
  const items = query.data?.items ?? [];
  const unreadIds = items.filter((item) => !item.readAt).map((item) => item.id);
  const unread = unreadIds.length;
  const read = useGameReadNotifications();
  const clearUnread = () => read.mutate({ ids: unreadIds, bulk: true });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNote =
    items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  return (
    <WorkspaceTabs
      className="mailbox-panel"
      value={tab}
      onValueChange={(value) =>
        setParams(value === "stars" ? { tab: "stars" } : {}, {
          replace: true,
        })
      }
    >
      <div className="game-page-head">
        <GameUnreadHeading
          title={uiCopy.gameNavigation.notifications}
          unread={unread}
          pending={read.isPending}
          onClear={clearUnread}
        />
        <Tabs.List
          className="game-segment game-segment--wide"
          aria-label={uiCopy.gameNotificationsPage.eyebrow}
          style={
            {
              "--seg-index": tab === "journey" ? 0 : 1,
            } as CSSProperties
          }
        >
          <span className="game-segment__thumb" aria-hidden="true" />
          <Tabs.Trigger value="journey">
            {uiCopy.mailbox.journey}
            {unread > 0 ? ` · ${unread}` : ""}
          </Tabs.Trigger>
          <Tabs.Trigger value="stars">{uiCopy.mailbox.stars}</Tabs.Trigger>
        </Tabs.List>
      </div>

      {read.isError && unread > 0 && (
        <GameFailure error={read.error} retry={clearUnread} />
      )}

      <Tabs.Content value="journey">
        {query.isPending && (
          <GameLoading label={uiCopy.gameNotificationsPage.loading} />
        )}
        {query.isError && (
          <GameFailure error={query.error} retry={() => void query.refetch()} />
        )}
        {items.length > 0 &&
          (isDesktop ? (
            <div className="mailbox-split">
              <div className="mailbox-list">
                {items.map((note) => (
                  <NotificationLetter
                    key={note.id}
                    note={note}
                    selected={selectedNote?.id === note.id}
                    onSelect={() => setSelectedId(note.id)}
                  />
                ))}
              </div>
              {selectedNote && (
                <DesktopLetterReader
                  key={selectedNote.id}
                  note={selectedNote}
                />
              )}
            </div>
          ) : (
            <div className="mailbox-list">
              {items.map((note) => (
                <NotificationLetter key={note.id} note={note} />
              ))}
            </div>
          ))}
        {query.isSuccess && !items.length && (
          <GameEmptyState title={uiCopy.gameNotificationsPage.emptyTitle}>
            {uiCopy.gameNotificationsPage.emptyDescription}
          </GameEmptyState>
        )}
      </Tabs.Content>

      <Tabs.Content value="stars">
        <StarLetters />
      </Tabs.Content>
    </WorkspaceTabs>
  );
}
