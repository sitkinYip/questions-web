import { AppDialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { overlayPriority } from "../../components/ui/overlay-context";
import type { MultiQuestClue } from "../../domain/quest/types";
import { RichContent } from "../content/RichContent";

interface MultiQuestClueDialogProps {
  clue: MultiQuestClue | null;
  open: boolean;
  onClose: () => void;
}

export function MultiQuestClueDialog({
  clue,
  open,
  onClose,
}: MultiQuestClueDialogProps) {
  if (!open || !clue) return null;
  return (
    <AppDialog
      overlayId="multi-quest-clue"
      priority={overlayPriority.content}
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      accessibleTitle={clue.title || "隐藏的本场线索"}
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
        <p className="eyebrow">Combined revelation</p>
        <h2 id="multi-clue-title">{clue.title || "隐藏的本场线索"}</h2>
        <RichContent source={clue.content} className="multi-clue-content" />
      </div>
      <footer>
        <p>{clue.description || "该本场线索会保留在当前会话中。"}</p>
        <Button variant="primary" onClick={onClose}>
          {clue.buttonText || "我知道了"}
        </Button>
      </footer>
    </AppDialog>
  );
}
