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
      <div className="rank-up-orbit" aria-hidden="true">
        <div className="rank-up-core">{rank.code}</div>
      </div>
      <p className="eyebrow">Rank ascension</p>
      <p className="rank-up-label">等级提升</p>
      <h2 id="rank-up-title">{rank.name}</h2>
      <p className="rank-up-description">冒险者的力量得到了升华</p>
      <Button variant="primary" onClick={onClose} data-modal-initial-focus>
        继续冒险
      </Button>
    </AppDialog>
  );
}
