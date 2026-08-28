import { useSyncExternalStore } from "react";

/** One capability boundary for desktop presentation; business state never lives here. */
export const DESKTOP_LAYOUT_QUERY = "(min-width: 1100px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(DESKTOP_LAYOUT_QUERY);
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}

export function useDesktopLayout() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(DESKTOP_LAYOUT_QUERY).matches ?? false,
    () => false,
  );
}
