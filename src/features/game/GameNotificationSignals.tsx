import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppToast } from "@/components/ui/Toast";
import { useOverlayStatus } from "@/components/ui/overlay-context";
import { uiCopy } from "@/config/ui-copy";
import { useGameNotifications } from "@/features/game/game-queries";

/** One polling owner for the signed-in game; cold hydration only updates badges. */
export function GameNotificationSignals() {
  const query = useGameNotifications(true);
  const location = useLocation();
  const navigate = useNavigate();
  const overlay = useOverlayStatus();
  const known = useRef<Set<string> | null>(null);
  const [arrival, setArrival] = useState(0);
  const [dismissed, setDismissed] = useState(0);
  const unread = query.data?.items.filter((item) => !item.readAt) ?? [];
  const outsideInbox =
    !location.pathname.startsWith("/play/") &&
    location.pathname !== "/notifications";

  useEffect(() => {
    if (!query.data || !query.isSuccess) return;
    const previous = known.current;
    const items = query.data.items;
    known.current = new Set([
      ...(previous ?? []),
      ...items.map((item) => item.id),
    ]);
    if (previous === null || !outsideInbox || document.hidden) return;
    if (items.some((item) => !item.readAt && !previous.has(item.id))) {
      setArrival((value) => value + 1);
    }
  }, [query.data, query.isSuccess, outsideInbox]);

  const openInbox = () => {
    setDismissed(arrival);
    void navigate("/notifications");
  };
  return (
    <AppToast
      key={arrival}
      open={
        arrival > dismissed &&
        unread.length > 0 &&
        outsideInbox &&
        !overlay.hasOpenOverlay
      }
      onOpenChange={(open) => {
        if (!open) setDismissed(arrival);
      }}
      className="game-mail-toast"
      title={uiCopy.gameNotificationCenter.newArrival}
      description={uiCopy.gameNotificationCenter.unreadSummary(unread.length)}
      actionLabel={uiCopy.gameNotificationCenter.viewInbox}
      onAction={openInbox}
      onContentClick={openInbox}
    />
  );
}
