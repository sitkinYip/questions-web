import { useRef, useState, type ReactNode } from "react";
import { DropdownMenu } from "radix-ui";
import { ArrowRightIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { uiCopy } from "@/config/ui-copy";
import { useImmersiveLight } from "@/design/useImmersiveLight";

/** 来信列表行：极光玻璃 L1 沉浸光感卡片，保留左滑收下与菜单能力。 */
export function MailboxRow({
  title,
  summary,
  meta,
  icon,
  unread = false,
  selected = false,
  pending = false,
  onOpen,
  onRead,
}: {
  title: string;
  summary: string;
  meta: ReactNode;
  icon: ReactNode;
  unread?: boolean;
  selected?: boolean;
  pending?: boolean;
  onOpen: () => void;
  onRead?: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const actionable = unread && !!onRead;
  const light = useImmersiveLight(true);
  return (
    <article
      className="mailbox-row notification-letter"
      data-read={!unread}
      data-selected={selected || undefined}
      data-revealed={actionable && revealed}
      {...light}
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
          <span className="mailbox-row__title">{title}</span>
          {summary && <span className="mailbox-row__summary">{summary}</span>}
          <span className="mailbox-row__meta">{meta}</span>
        </span>
        {!actionable && (
          <ArrowRightIcon className="mailbox-row__arrow" aria-hidden="true" />
        )}
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
                data-motion-menu
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
