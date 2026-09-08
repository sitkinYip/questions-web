import { uiCopy } from "@/config/ui-copy";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EnvelopeSimpleIcon,
  EnvelopeOpenIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { gameApi } from "@/api/game.client";
import type { GameNotification } from "@/api/game.contracts";
import { Button } from "@/components/ui/Button";
import { RichContent } from "@/features/content/RichContent";
import { GameFailure } from "@/features/game/components/GameState";
import { gameKeys } from "@/features/game/game-queries";
import { formatGameDate } from "@/features/game/game-presentation";
import { useGame } from "@/features/game/useGame";

export function NotificationLetter({
  note,
  desktop = false,
}: {
  note: GameNotification;
  desktop?: boolean;
}) {
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
      desktop={desktop}
      pending={mutation.isPending}
      error={mutation.isError ? mutation.error : undefined}
      onRead={() => mutation.mutate()}
    />
  );
}

export function NotificationLetterView({
  note,
  desktop = false,
  pending = false,
  error,
  onRead,
}: {
  note: GameNotification;
  desktop?: boolean;
  pending?: boolean;
  error?: unknown;
  onRead: () => void;
}) {
  return (
    <article className="notification-letter" data-read={!!note.readAt}>
      <div className="notification-letter__seal" aria-hidden="true">
        {note.readAt ? (
          <EnvelopeOpenIcon weight="thin" />
        ) : (
          <EnvelopeSimpleIcon weight="thin" />
        )}
      </div>
      <div className="notification-letter__body">
        <p className="game-status" data-tone={note.readAt ? "muted" : "accent"}>
          {note.readAt
            ? uiCopy.notificationLetter.read
            : uiCopy.notificationLetter.newLetter}
          <time dateTime={note.sentAt}>{formatGameDate(note.sentAt)}</time>
        </p>
        <h2>{note.title}</h2>
        <RichContent
          source={note.content}
          className="notification-letter__message"
          tabIndex={desktop ? 0 : undefined}
        />
        {!!error && <GameFailure error={error} retry={onRead} />}
        <div className="notification-letter__action">
          {!note.readAt ? (
            <Button onClick={onRead} disabled={pending}>
              {pending
                ? uiCopy.notificationLetter.pending
                : note.buttonText || uiCopy.notificationLetter.accept}
            </Button>
          ) : (
            <span className="game-muted" role="status">
              <CheckIcon aria-hidden="true" />
              {uiCopy.notificationLetter.saved}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
