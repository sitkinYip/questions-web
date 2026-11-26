import { ChecksIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { uiCopy } from "@/config/ui-copy";

export function GameUnreadHeading({
  title,
  unread,
  pending = false,
  onClear,
}: {
  title: string;
  unread: number;
  pending?: boolean;
  onClear: () => void;
}) {
  return (
    <div className="game-page-head__title">
      <h1>{title}</h1>
      {unread > 0 && (
        <Button
          className="game-page-head__clear"
          variant="ghost"
          size="small"
          disabled={pending}
          onClick={onClear}
        >
          <ChecksIcon weight="bold" aria-hidden="true" />
          {pending ? uiCopy.gameUnread.clearing : uiCopy.gameUnread.clear}
        </Button>
      )}
    </div>
  );
}
