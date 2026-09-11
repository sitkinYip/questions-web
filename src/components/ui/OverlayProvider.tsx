import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { OverlayContext } from "@/components/ui/overlay-context";

interface OverlayEntry {
  id: string;
  priority: number;
  order: number;
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<OverlayEntry[]>([]);
  const orderRef = useRef(0);
  const interaction = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const pointer = (event: PointerEvent) => {
      interaction.current =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(
              "button, a[href], input, select, textarea, [tabindex]",
            )
          : null;
    };
    const keyboard = () => {
      interaction.current = null;
    };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
    };
  }, []);
  const getFocusOrigin = useCallback(() => {
    const target = interaction.current;
    interaction.current = null;
    return target?.isConnected
      ? target
      : document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }, []);

  const request = useCallback((id: string, priority: number) => {
    setEntries((current) => {
      if (current.some((entry) => entry.id === id)) return current;
      orderRef.current += 1;
      return [...current, { id, priority, order: orderRef.current }];
    });
  }, []);
  const release = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);
  const activeId = useMemo(
    () =>
      [...entries].sort(
        (left, right) =>
          right.priority - left.priority || left.order - right.order,
      )[0]?.id ?? null,
    [entries],
  );
  const value = useMemo(
    () => ({
      activeId,
      openCount: entries.length,
      request,
      release,
      getFocusOrigin,
    }),
    [activeId, entries.length, release, request, getFocusOrigin],
  );

  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
}
