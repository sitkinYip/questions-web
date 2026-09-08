import { uiCopy } from "@/config/ui-copy";
import type { ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";
import { AppDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { overlayPriority } from "@/components/ui/overlay-context";

interface SheetProps {
  overlayId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  headerContent?: ReactNode;
  className?: string;
  side?: "left" | "right";
  density?: "comfortable" | "compact";
  priority?: number;
  children: ReactNode;
}

export function Sheet({
  overlayId,
  open,
  onOpenChange,
  title,
  description,
  headerContent,
  className,
  side = "right",
  density = "comfortable",
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
      contentClassName={`ui-sheet ui-sheet--${side} ui-sheet--${density}${className ? ` ${className}` : ""}`}
    >
      <header className="ui-sheet__header">
        {headerContent ?? (
          <div>
            {density === "comfortable" && (
              <p className="eyebrow">{uiCopy.sheet.eyebrow}</p>
            )}
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
        )}
        <Button
          variant="icon"
          className="ui-sheet__close"
          aria-label={uiCopy.sheet.closeTitle(title)}
          onClick={() => onOpenChange(false)}
        >
          <XIcon aria-hidden="true" weight="bold" />
        </Button>
      </header>
      <div className="ui-sheet__body">{children}</div>
    </AppDialog>
  );
}
