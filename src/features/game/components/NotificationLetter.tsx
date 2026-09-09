import { useState } from "react";
import { uiCopy } from "@/config/ui-copy";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EnvelopeSimpleIcon, EnvelopeOpenIcon } from "@phosphor-icons/react";
import { gameApi } from "@/api/game.client";
import type { GameNotification } from "@/api/game.contracts";
import { GameFailure } from "@/features/game/components/GameState";
import { gameKeys } from "@/features/game/game-queries";
import { formatGameDate } from "@/features/game/game-presentation";
import { useGame } from "@/features/game/useGame";
import { MailboxRow } from "@/features/mailbox/MailboxRow";
import { NotificationDialog } from "@/features/notification/NotificationDialog";
import {
  MediaViewer,
  type MediaViewerState,
} from "@/features/media/MediaViewer";
import { parseLegacyContent } from "@/domain/content/parser";

export function NotificationLetter({ note }: { note: GameNotification }) {
  const { player } = useGame();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => gameApi.readNotification(note.id),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: gameKeys.notifications(player.id) }),
  });
  return (
    <NotificationLetterView
      note={note}
      pending={mutation.isPending}
      error={mutation.isError ? mutation.error : undefined}
      onRead={() => mutation.mutateAsync()}
    />
  );
}

export function NotificationLetterView({
  note,
  pending = false,
  error,
  onRead,
  defaultOpen = false,
}: {
  note: GameNotification;
  pending?: boolean;
  error?: unknown;
  onRead: () => void | Promise<unknown>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [media, setMedia] = useState<MediaViewerState>(null);
  const summary = parseLegacyContent(note.content)
    .map((segment) => ("content" in segment ? segment.content : " "))
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  async function accept() {
    if (pending) return;
    try {
      await onRead();
      setOpen(false);
    } catch {
      /* The mutation exposes an actionable error below. */
    }
  }
  return (
    <>
      <MailboxRow
        title={
          note.title || note.popupTitle || uiCopy.notificationLetter.newLetter
        }
        summary={summary || uiCopy.mailbox.media}
        meta={
          <>
            <span>
              {note.readAt
                ? uiCopy.notificationLetter.read
                : uiCopy.notificationLetter.newLetter}
            </span>
            <time dateTime={note.sentAt}>{formatGameDate(note.sentAt)}</time>
          </>
        }
        icon={
          note.readAt ? (
            <EnvelopeOpenIcon weight="thin" />
          ) : (
            <EnvelopeSimpleIcon weight="thin" />
          )
        }
        unread={!note.readAt}
        pending={pending}
        onOpen={() => setOpen(true)}
        onRead={() => void accept()}
      />
      {!!error && !open && (
        <GameFailure error={error} retry={() => void accept()} />
      )}
      <NotificationDialog
        notification={
          open && !media
            ? {
                ...note,
                buttonText: note.readAt
                  ? uiCopy.mailbox.close
                  : note.buttonText || uiCopy.notificationLetter.accept,
                createdAt: note.sentAt,
                revision: note.sentAt,
              }
            : null
        }
        userId=""
        queuedCount={1}
        onClose={() => setOpen(false)}
        onAcknowledge={note.readAt ? () => setOpen(false) : () => void accept()}
        pending={pending}
        feedback={
          error ? (
            <GameFailure error={error} retry={() => void accept()} />
          ) : undefined
        }
        onOpenImages={(urls) => setMedia({ type: "images", urls, index: 0 })}
        onOpenVideo={(url, poster) => setMedia({ type: "video", url, poster })}
      />
      <MediaViewer
        state={media}
        onClose={() => setMedia(null)}
        onImageIndexChange={(index) =>
          setMedia((current) =>
            current?.type === "images" ? { ...current, index } : current,
          )
        }
        onVideoPlayingChange={() => {}}
      />
    </>
  );
}
