import { useState } from "react";
import { EnvelopeSimpleIcon, EnvelopeOpenIcon } from "@phosphor-icons/react";
import type { GameNotification } from "../../../api/game.contracts";
import { NotificationLetter } from "../components/NotificationLetter";
import { formatGameDate } from "../game-presentation";

export function DesktopInbox({ notes }: { notes: GameNotification[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => notes[0]?.id ?? null,
  );
  const selected = notes.find((note) => note.id === selectedId) ?? notes[0];
  if (!selected) return null;
  return (
    <div className="desktop-inbox">
      <nav className="desktop-inbox__list" aria-label="来信列表">
        <div className="desktop-inbox__heading">
          <span>沿途的消息</span>
          <small>{notes.length} 封来信</small>
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
            <small>{note.readAt ? "已收下" : "未读"}</small>
          </button>
        ))}
      </nav>
      <NotificationLetter key={selected.id} note={selected} desktop />
    </div>
  );
}
