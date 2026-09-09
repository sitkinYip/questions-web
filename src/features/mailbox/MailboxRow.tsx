import { useRef, useState, type ReactNode } from "react";
import { DropdownMenu } from "radix-ui";
import { DotsThreeIcon } from "@phosphor-icons/react";
import { uiCopy } from "@/config/ui-copy";

/** A compact inbox entry. Gesture state stays local; persistence belongs to the caller. */
export function MailboxRow({
  title,
  summary,
  meta,
  icon,
  unread = false,
  pending = false,
  onOpen,
  onRead,
}: {
  title: string;
  summary: string;
  meta: ReactNode;
  icon: ReactNode;
  unread?: boolean;
  pending?: boolean;
  onOpen: () => void;
  onRead?: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const actionable = unread && !!onRead;
  return (
    <article
      className="mailbox-row notification-letter"
      data-read={!unread}
      data-revealed={actionable && revealed}
    >
      {actionable && (
        <button
          type="button"
          className="mailbox-row__accept"
          tabIndex={revealed ? 0 : -1}
          aria-hidden={!revealed}
          disabled={pending}
          onClick={onRead}
        >
          {pending ? uiCopy.notificationLetter.pending : uiCopy.mailbox.accept}
        </button>
      )}
      <button
        type="button"
        className="mailbox-row__open"
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          if (actionable && revealed) {
            setRevealed(false);
            return;
          }
          onOpen();
        }}
        onPointerDown={(event) => {
          suppressClick.current = false;
          if (!actionable || event.pointerType === "mouse") return;
          start.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerMove={(event) => {
          const origin = start.current;
          if (!origin) return;
          const dx = event.clientX - origin.x,
            dy = event.clientY - origin.y;
          if (Math.abs(dy) > 20 && Math.abs(dy) > Math.abs(dx)) {
            start.current = null;
            return;
          }
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            suppressClick.current = true;
            setRevealed(dx < 0);
          }
        }}
        onPointerUp={() => {
          start.current = null;
        }}
        onPointerCancel={() => {
          start.current = null;
        }}
      >
        <span className="mailbox-row__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="mailbox-row__body">
          <span className="mailbox-row__meta">{meta}</span>
          <span className="mailbox-row__title">{title}</span>
          <span className="mailbox-row__summary">{summary}</span>
        </span>
        {unread && (
          <span
            className="mailbox-row__unread"
            aria-label={uiCopy.mailbox.unread}
          />
        )}
      </button>
      {actionable && (
        <div className="mailbox-row__menu">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              className="mailbox-row__more"
              aria-label={uiCopy.mailbox.actions}
              disabled={pending}
            >
              <DotsThreeIcon />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="mailbox-menu"
                sideOffset={4}
                align="end"
              >
                <DropdownMenu.Item disabled={pending} onSelect={onRead}>
                  {uiCopy.mailbox.markRead}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}
    </article>
  );
}
