import { AppDialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { overlayPriority } from "../../components/ui/overlay-context";
import type { QuestClue } from "../../domain/quest/types";
import { RichContent } from "../content/RichContent";

interface ClueTextDialogProps {
  clue: QuestClue | null;
  onClose: () => void;
}

export function ClueTextDialog({ clue, onClose }: ClueTextDialogProps) {
  if (!clue) return null;
  return (
    <AppDialog
      overlayId="quest-clue"
      priority={overlayPriority.content}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      accessibleTitle={clue.title || "古老密卷"}
      overlayClassName="clue-dialog-backdrop"
      contentClassName="clue-dialog"
    >
      <div className="clue-dialog-sigil" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <Button
        variant="icon"
        className="clue-dialog-close"
        onClick={onClose}
        aria-label="关闭线索"
      >
        ×
      </Button>
      <p className="eyebrow">Decoded fragment</p>
      <h2 id="clue-dialog-title">{clue.title || "古老密卷"}</h2>
      <span className="clue-dialog-rule" aria-hidden="true" />
      <RichContent source={clue.content} className="clue-dialog-content" />
    </AppDialog>
  );
}
