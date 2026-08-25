import type { ReactNode } from "react";
import { AppDialog } from "./Dialog";
import { Button } from "./Button";
import { overlayPriority } from "./overlay-context";

interface SheetProps {
  overlayId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "left" | "right";
  priority?: number;
  children: ReactNode;
}

export function Sheet({
  overlayId,
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  priority = overlayPriority.content,
  children,
}: SheetProps) {
  return (
    <AppDialog
      overlayId={overlayId}
      priority={priority}
      open={open}
      onOpenChange={onOpenChange}
      accessibleTitle={title}
      accessibleDescription={description}
      overlayClassName={`ui-sheet-overlay ui-sheet-overlay--${side}`}
      contentClassName={`ui-sheet ui-sheet--${side}`}
    >
      <header className="ui-sheet__header">
        <div>
          <p className="eyebrow">Side archive</p>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <Button
          variant="icon"
          size="small"
          aria-label={`关闭${title}`}
          onClick={() => onOpenChange(false)}
        >
          ×
        </Button>
      </header>
      <div className="ui-sheet__body">{children}</div>
    </AppDialog>
  );
}
