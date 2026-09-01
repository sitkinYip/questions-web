import { LightningIcon } from "@phosphor-icons/react";
import { AppDialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { RitualParticles } from "../../components/effects/RitualParticles";
import { overlayPriority } from "../../components/ui/overlay-context";
import type { QuestRank } from "../../domain/quest/types";

interface RankUpDialogProps {
  rank: QuestRank | null;
  onClose: () => void;
}

export function RankUpDialog({ rank, onClose }: RankUpDialogProps) {
  if (!rank) return null;
  return (
    <AppDialog
      overlayId="rank-up"
      priority={overlayPriority.rank}
      open
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
            <small>RANK</small>
            <strong>{rank.code}</strong>
          </div>
        </div>
      </div>
      <p className="rank-up-label">等级突破</p>
      <h2 id="rank-up-title">{rank.name}</h2>
      <p className="rank-up-description">新的冒险等级已经生效</p>
      <div className="rank-up-status">
        <LightningIcon weight="fill" aria-hidden="true" />
        <span>
          <strong>RANK {rank.code}</strong>
          <small>能力权限已同步</small>
        </span>
      </div>
      <Button
        variant="primary"
        className="rank-up-action"
        onClick={onClose}
        data-modal-initial-focus
      >
        继续冒险
      </Button>
    </AppDialog>
  );
}
