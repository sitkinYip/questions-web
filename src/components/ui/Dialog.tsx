import { useMotionPresence } from "@/shared/motion/useMotionPresence";
import { Dialog } from "radix-ui";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useOverlayGate,
  useOverlayFocusOrigin,
} from "@/components/ui/overlay-context";

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
  placement?: "center" | "left" | "right" | "bottom";
  onExitComplete?: () => void;
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
  placement = "center",
  onExitComplete,
  children,
}: AppDialogProps) {
  const getFocusOrigin = useOverlayFocusOrigin();
  const contentRef = useRef<HTMLDivElement>(null);
  const present = useMotionPresence(open, contentRef);
  const active = useOverlayGate(overlayId, present, priority);
  const visible = open && active;
  const suspended = present && !active;
  const wasPresent = useRef(present);
  useLayoutEffect(() => {
    if (wasPresent.current && !present) onExitComplete?.();
    wasPresent.current = present;
  }, [onExitComplete, present]);
  const [resumeState, setResumeState] = useState({
    present,
    suspended,
    resumed: false,
    seen: visible,
  });
  if (
    resumeState.present !== present ||
    resumeState.suspended !== suspended ||
    (!resumeState.seen && visible)
  ) {
    setResumeState({
      present,
      suspended,
      seen: present && (resumeState.seen || visible),
      resumed:
        present && (resumeState.resumed || (suspended && resumeState.seen)),
    });
  }
  const resumed = resumeState.resumed;
  const shown = useRef(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  const focusIndex = useRef(-1);
  const pointerFocusIndex = useRef(-1);
  useLayoutEffect(() => {
    if (!present) {
      shown.current = false;
      focusIndex.current = -1;
      pointerFocusIndex.current = -1;
      return;
    }
    if (!visible) {
      contentRef.current?.querySelectorAll("video, audio").forEach((node) => {
        const media = node as HTMLMediaElement;
        if (!media.paused) media.pause();
      });
      return;
    }
    if (shown.current) {
      const target = lastFocus.current;
      if (target?.isConnected) target.focus({ preventScroll: true });
    }
    shown.current = true;
  }, [present, suspended, visible]);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const life = useRef({ present, active });
  useLayoutEffect(() => {
    life.current = { present, active };
  }, [present, active]);
  const scrollPositions = useRef<Array<{ top: number; left: number }>>([]);
  const setContent = useCallback((node: HTMLDivElement | null) => {
    const previous = contentRef.current;
    if (previous) {
      previous.querySelectorAll("video, audio").forEach((element) => {
        const media = element as HTMLMediaElement;
        if (!media.paused) media.pause();
      });
      scrollPositions.current = [
        previous,
        ...previous.querySelectorAll<HTMLElement>("*"),
      ].map((element) => ({
        top: element.scrollTop,
        left: element.scrollLeft,
      }));
    }
    contentRef.current = node;
    if (node) {
      [node, ...node.querySelectorAll<HTMLElement>("*")].forEach(
        (element, index) => {
          const position = scrollPositions.current[index];
          if (position) {
            element.scrollTop = position.top;
            element.scrollLeft = position.left;
          }
        },
      );
    }
  }, []);
  const descriptionProps = accessibleDescription
    ? {}
    : { "aria-describedby": undefined };

  if (!present) return null;

  return (
    <Dialog.Root
      modal={active}
      open={visible}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && visible) onOpenChange(false);
      }}
    >
      <Dialog.Portal forceMount>
        <Dialog.Overlay
          forceMount
          className={overlayClassName}
          data-resumed={resumed && visible ? "true" : undefined}
          data-motion-overlay
          data-placement={placement}
          data-suspended={suspended ? "true" : undefined}
          style={suspended ? { display: "none" } : undefined}
        >
          <Dialog.Content
            forceMount
            ref={setContent}
            onFocusCapture={(event) => {
              lastFocus.current = event.target as HTMLElement;
              focusIndex.current = Array.from(
                event.currentTarget.querySelectorAll("*"),
              ).indexOf(event.target as Element);
            }}
            onPointerDownCapture={(event) => {
              const target = (event.target as Element).closest<HTMLElement>(
                "button, a[href], input, select, textarea, [tabindex]",
              );
              if (target && event.currentTarget.contains(target)) {
                lastFocus.current = target;
                pointerFocusIndex.current = Array.from(
                  event.currentTarget.querySelectorAll("*"),
                ).indexOf(target);
              }
            }}
            data-motion-surface
            data-placement={placement}
            data-exiting={!open ? "true" : undefined}
            inert={!visible ? true : undefined}
            onClickCapture={(event) => {
              if (!visible) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            className={contentClassName}
            {...descriptionProps}
            onOpenAutoFocus={(event) => {
              if (!visible) {
                event.preventDefault();
                return;
              }
              const restoreIndex =
                pointerFocusIndex.current >= 0
                  ? pointerFocusIndex.current
                  : focusIndex.current;
              if (shown.current && restoreIndex >= 0) {
                event.preventDefault();
                contentRef.current
                  ?.querySelectorAll<HTMLElement>("*")
                  [restoreIndex]?.focus({ preventScroll: true });
              }
              const activeElement =
                getFocusOrigin?.() ?? document.activeElement;
              if (!returnFocusRef.current)
                returnFocusRef.current =
                  activeElement instanceof HTMLElement ? activeElement : null;
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (life.current.present) return;
              const target = returnFocusRef.current;
              if (target?.isConnected) target.focus({ preventScroll: true });
              else
                document
                  .querySelector<HTMLElement>("#game-content, main[tabindex]")
                  ?.focus({ preventScroll: true });
              returnFocusRef.current = null;
            }}
            onEscapeKeyDown={(event) => {
              if (!closeOnEscape) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (!closeOnOutside) event.preventDefault();
            }}
            onKeyDownCapture={() => {
              pointerFocusIndex.current = -1;
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
