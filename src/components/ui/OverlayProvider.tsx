import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { OverlayContext } from "@/components/ui/overlay-context";

interface OverlayEntry {
  id: string;
  priority: number;
  order: number;
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<OverlayEntry[]>([]);
  const orderRef = useRef(0);

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
    () => ({ activeId, openCount: entries.length, request, release }),
    [activeId, entries.length, release, request],
  );

  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
}
