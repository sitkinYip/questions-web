import { useExitSnapshot } from "@/shared/motion/useExitSnapshot";
import { uiCopy } from "@/config/ui-copy";
import { LightningIcon } from "@phosphor-icons/react";
import { AppDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { RitualParticles } from "@/components/effects/RitualParticles";
import { overlayPriority } from "@/components/ui/overlay-context";
import type { QuestRank } from "@/domain/quest/types";

interface RankUpDialogProps {
  rank: QuestRank | null;
  onClose: () => void;
}

export function RankUpDialog({
  rank: requestedValue,
  onClose,
}: RankUpDialogProps) {
  const snapshot = useExitSnapshot(requestedValue);
  const rank = snapshot.value;
  if (!rank) return null;
  return (
    <AppDialog
      overlayId="rank-up"
      priority={overlayPriority.rank}
      open={snapshot.open}
      onExitComplete={snapshot.release}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      accessibleTitle={rank.name}
      overlayClassName="rank-up-backdrop"
      contentClassName="rank-up-dialog"
      closeOnOutside={false}
    >
      <div className="rank-up-rays" aria-hidden="true" />
      <RitualParticles variant="gold" />
      <div className="rank-up-frame" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="rank-up-emblem" aria-hidden="true">
        <div className="rank-up-wings">
          <i />
          <i />
        </div>
        <div className="rank-up-orbit">
          <div className="rank-up-core">
            <small>{uiCopy.rankUpDialog.rankLabel}</small>
            <strong>{rank.code}</strong>
          </div>
        </div>
      </div>
      <p className="rank-up-label">{uiCopy.rankUpDialog.title}</p>
      <h2 id="rank-up-title">{rank.name}</h2>
      <p className="rank-up-description">{uiCopy.rankUpDialog.description}</p>
      <div className="rank-up-status">
        <LightningIcon weight="fill" aria-hidden="true" />
        <span>
          <strong>{uiCopy.rankUpDialog.rank(rank.code)}</strong>
          <small>{uiCopy.rankUpDialog.status}</small>
        </span>
      </div>
      <Button
        variant="primary"
        className="rank-up-action"
        onClick={onClose}
        data-modal-initial-focus
      >
        {uiCopy.rankUpDialog.continueAdventure}
      </Button>
    </AppDialog>
  );
}
