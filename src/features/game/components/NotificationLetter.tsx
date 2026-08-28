import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EnvelopeSimpleIcon,
  EnvelopeOpenIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { gameApi } from "../../../api/game.client";
import type { GameNotification } from "../../../api/game.contracts";
import { Button } from "../../../components/ui/Button";
import { RichContent } from "../../content/RichContent";
import { GameFailure } from "./GameState";
import { gameKeys } from "../game-queries";
import { formatGameDate } from "../game-presentation";
import { useGame } from "../useGame";

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
          {note.readAt ? "已收下" : "一封新来信"}
          <time dateTime={note.sentAt}>{formatGameDate(note.sentAt)}</time>
        </p>
        <h2>{note.title}</h2>
        <RichContent
          source={note.content}
          className="notification-letter__message"
          tabIndex={desktop ? 0 : undefined}
        />
        {mutation.isError && (
          <GameFailure error={mutation.error} retry={() => mutation.mutate()} />
        )}
        <div className="notification-letter__action">
          {!note.readAt ? (
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "正在收下…"
                : note.buttonText || "收下这封信"}
            </Button>
          ) : (
            <span className="game-muted" role="status">
              <CheckIcon aria-hidden="true" />
              来信已收好
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
