import { Dialog } from "radix-ui";
import { useRef, type ReactNode } from "react";
import { useOverlayGate } from "@/components/ui/overlay-context";

interface AppDialogProps {
  overlayId: string;
  priority: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessibleTitle: string;
  accessibleDescription?: string;
  overlayClassName: string;
  contentClassName: string;
  closeOnEscape?: boolean;
  closeOnOutside?: boolean;
  children: ReactNode;
}

export function AppDialog({
  overlayId,
  priority,
  open,
  onOpenChange,
  accessibleTitle,
  accessibleDescription,
  overlayClassName,
  contentClassName,
  closeOnEscape = true,
  closeOnOutside = true,
  children,
}: AppDialogProps) {
  const visible = useOverlayGate(overlayId, open, priority);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const descriptionProps = accessibleDescription
    ? {}
    : { "aria-describedby": undefined };

  return (
    <Dialog.Root
      open={visible}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onOpenChange(false);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClassName}>
          <Dialog.Content
            className={contentClassName}
            {...descriptionProps}
            onOpenAutoFocus={() => {
              const activeElement = document.activeElement;
              returnFocusRef.current =
                activeElement instanceof HTMLElement ? activeElement : null;
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              returnFocusRef.current?.focus();
              returnFocusRef.current = null;
            }}
            onEscapeKeyDown={(event) => {
              if (!closeOnEscape) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (!closeOnOutside) event.preventDefault();
            }}
            onKeyDown={(event) => {
              // Safari uses Option-Tab to include buttons. Radix's normal Tab
              // loop excludes Alt, so handle only its boundary case here.
              if (
                event.key !== "Tab" ||
                !event.altKey ||
                event.ctrlKey ||
                event.metaKey
              )
                return;
              const nodes = Array.from(
                event.currentTarget.querySelectorAll<HTMLElement>(
                  "button, a[href], input, select, textarea, [tabindex]",
                ),
              ).filter(
                (node) =>
                  node.tabIndex >= 0 &&
                  !node.matches(":disabled, [hidden]") &&
                  node.getClientRects().length > 0,
              );
              const first = nodes[0],
                last = nodes.at(-1);
              const target =
                event.shiftKey && document.activeElement === first
                  ? last
                  : !event.shiftKey && document.activeElement === last
                    ? first
                    : null;
              if (target) {
                event.preventDefault();
                target.focus();
              }
            }}
          >
            <Dialog.Title className="sr-only">{accessibleTitle}</Dialog.Title>
            {accessibleDescription && (
              <Dialog.Description className="sr-only">
                {accessibleDescription}
              </Dialog.Description>
            )}
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
