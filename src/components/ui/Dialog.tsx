import { Dialog } from "radix-ui";
import { useRef, type ReactNode } from "react";
import { useOverlayGate } from "./overlay-context";

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
