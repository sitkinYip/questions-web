import { uiCopy } from "@/config/ui-copy";
import { useState } from "react";
import { EnvelopeSimpleIcon, EnvelopeOpenIcon } from "@phosphor-icons/react";
import type { GameNotification } from "@/api/game.contracts";
import { NotificationLetter } from "@/features/game/components/NotificationLetter";
import { formatGameDate } from "@/features/game/game-presentation";

export function DesktopInbox({ notes }: { notes: GameNotification[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => notes[0]?.id ?? null,
  );
  const selected = notes.find((note) => note.id === selectedId) ?? notes[0];
  if (!selected) return null;
  return (
    <div className="desktop-inbox">
      <nav
        className="desktop-inbox__list"
        aria-label={uiCopy.desktopInbox.label}
      >
        <div className="desktop-inbox__heading">
          <span>{uiCopy.desktopInbox.title}</span>
          <small>{uiCopy.desktopInbox.letterCount(notes.length)}</small>
        </div>
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            aria-pressed={selected.id === note.id}
            onClick={() => setSelectedId(note.id)}
          >
            {note.readAt ? (
              <EnvelopeOpenIcon aria-hidden="true" />
            ) : (
              <EnvelopeSimpleIcon aria-hidden="true" />
            )}
            <span>
              <strong>{note.title}</strong>
              <time dateTime={note.sentAt}>{formatGameDate(note.sentAt)}</time>
            </span>
            <small>
              {note.readAt
                ? uiCopy.desktopInbox.read
                : uiCopy.desktopInbox.unread}
            </small>
          </button>
        ))}
      </nav>
      <NotificationLetter key={selected.id} note={selected} desktop />
    </div>
  );
}
