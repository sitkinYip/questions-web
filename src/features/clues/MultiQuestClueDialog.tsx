import { useExitSnapshot } from "@/shared/motion/useExitSnapshot";
import { uiCopy } from "@/config/ui-copy";
import { AppDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { overlayPriority } from "@/components/ui/overlay-context";
import type { MultiQuestClue } from "@/domain/quest/types";
import { RichContent } from "@/features/content/RichContent";

interface MultiQuestClueDialogProps {
  clue: MultiQuestClue | null;
  open: boolean;
  onClose: () => void;
}

export function MultiQuestClueDialog({
  clue: requestedValue,
  open,
  onClose,
}: MultiQuestClueDialogProps) {
  const snapshot = useExitSnapshot(open ? requestedValue : null);
  const clue = snapshot.value;
  if (!clue) return null;
  return (
    <AppDialog
      overlayId="multi-quest-clue"
      priority={overlayPriority.content}
      open={snapshot.open}
      onExitComplete={snapshot.release}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      accessibleTitle={clue.title || uiCopy.multiQuestClueDialog.title}
      overlayClassName="multi-clue-backdrop"
      contentClassName="multi-clue-dialog"
      closeOnOutside={false}
    >
      <div className="multi-clue-aura" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="multi-clue-dialog-scroll">
        <p className="eyebrow">{uiCopy.multiQuestClueDialog.eyebrow}</p>
        <h2 id="multi-clue-title">
          {clue.title || uiCopy.multiQuestClueDialog.title}
        </h2>
        <RichContent source={clue.content} className="multi-clue-content" />
      </div>
      <footer>
        <p>{clue.description || uiCopy.multiQuestClueDialog.description}</p>
        <Button variant="primary" onClick={onClose}>
          {clue.buttonText || uiCopy.multiQuestClueDialog.acknowledge}
        </Button>
      </footer>
    </AppDialog>
  );
}
