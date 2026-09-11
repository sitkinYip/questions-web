import { uiCopy } from "@/config/ui-copy";
import { useState } from "react";
import { ArrowsClockwiseIcon, BroadcastIcon } from "@phosphor-icons/react";
import { AppDialog } from "@/components/ui/Dialog";
import { AppToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

/** Mounted only during an outage: dismiss once, re-arm after recovery. */
export function GameSyncMessage({ active = true }: { active?: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const [previousActive, setPreviousActive] = useState(active);
  if (previousActive !== active) {
    setPreviousActive(active);
    if (active) setDismissed(false);
  }
  return (
    <AppToast
      open={active && !dismissed}
      onOpenChange={(open) => {
        if (!open) setDismissed(true);
      }}
      className="game-sync-message"
      title={uiCopy.gameRequestFeedback.syncTitle}
      description={uiCopy.gameRequestFeedback.syncDescription}
    />
  );
}

export function GameRetryDialog({
  open,
  pending,
  action,
  onRetry,
  onDismiss,
}: {
  open: boolean;
  pending: boolean;
  action: "answer" | "start";
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const title =
    action === "answer"
      ? uiCopy.gameRequestFeedback.answerTitle
      : uiCopy.gameRequestFeedback.startTitle;
  return (
    <AppDialog
      overlayId="game-request-retry"
      priority={95}
      open={open}
      onOpenChange={(value) => {
        if (!value && !pending) onDismiss();
      }}
      accessibleTitle={title}
      accessibleDescription={uiCopy.gameRequestFeedback.accessibleDescription}
      overlayClassName="game-retry-overlay"
      contentClassName="game-retry-dialog"
      closeOnEscape={!pending}
      closeOnOutside={false}
    >
      <div className="game-retry-signal" aria-hidden="true">
        <BroadcastIcon weight="light" />
      </div>
      <p className="eyebrow">{uiCopy.gameRequestFeedback.eyebrow}</p>
      <h2>{title}</h2>
      <p className="game-retry-detail">
        {action === "answer"
          ? uiCopy.gameRequestFeedback.answerDescription
          : uiCopy.gameRequestFeedback.startDescription}
      </p>
      <div className="game-retry-actions" aria-busy={pending}>
        <Button onClick={onRetry} disabled={pending}>
          <ArrowsClockwiseIcon aria-hidden="true" />
          {pending
            ? uiCopy.gameRequestFeedback.reconnecting
            : uiCopy.gameRequestFeedback.reconnect}
        </Button>
        <Button variant="ghost" onClick={onDismiss} disabled={pending}>
          {uiCopy.gameRequestFeedback.stay}
        </Button>
      </div>
      <p className="sr-only" role="status">
        {pending
          ? uiCopy.gameRequestFeedback.pendingStatus
          : uiCopy.gameRequestFeedback.failedStatus}
      </p>
    </AppDialog>
  );
}
