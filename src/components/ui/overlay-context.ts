import { createContext, useContext, useEffect } from "react";

export interface OverlayContextValue {
  activeId: string | null;
  openCount: number;
  request: (id: string, priority: number) => void;
  release: (id: string) => void;
}

export const OverlayContext = createContext<OverlayContextValue | null>(null);

export const overlayPriority = {
  notification: 20,
  rank: 40,
  content: 60,
  confirmation: 80,
  completion: 100,
} as const;

export function useOverlayGate(
  id: string,
  requestedOpen: boolean,
  priority: number,
) {
  const context = useContext(OverlayContext);
  const request = context?.request;
  const release = context?.release;
  useEffect(() => {
    if (!request || !release || !requestedOpen) return;
    request(id, priority);
    return () => release(id);
  }, [id, priority, release, request, requestedOpen]);
  return context ? requestedOpen && context.activeId === id : requestedOpen;
}

export function useOverlayStatus() {
  const context = useContext(OverlayContext);
  return {
    activeId: context?.activeId ?? null,
    openCount: context?.openCount ?? 0,
    hasOpenOverlay: Boolean(context?.openCount),
  };
}
