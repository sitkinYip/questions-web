import { uiCopy } from "@/config/ui-copy";
import { AppDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { RitualParticles } from "@/components/effects/RitualParticles";
import { overlayPriority } from "@/components/ui/overlay-context";

interface CompletionFeedbackDialogProps {
  variant: "final" | "multi" | null;
  completedCount: number;
  onContinue: () => void;
}

export function CompletionFeedbackDialog({
  variant,
  completedCount,
  onContinue,
}: CompletionFeedbackDialogProps) {
  if (!variant) return null;
  const isFinal = variant === "final";
  return (
    <AppDialog
      overlayId="quest-completion"
      priority={overlayPriority.completion}
      open
      onOpenChange={() => undefined}
      accessibleTitle={
        isFinal
          ? uiCopy.completionFeedbackDialog.finalTitle
          : uiCopy.completionFeedbackDialog.combinedTitle
      }
      overlayClassName={`completion-backdrop ${isFinal ? "is-final" : "is-multi"}`}
      contentClassName="completion-dialog"
      closeOnEscape={false}
      closeOnOutside={false}
    >
      <div className="completion-aura" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <RitualParticles variant={isFinal ? "gold" : "teal"} />
      <div className="completion-sigil" aria-hidden="true">
        {isFinal ? "✦" : completedCount}
      </div>
      <p className="eyebrow">
        {isFinal
          ? uiCopy.completionFeedbackDialog.finalEyebrow
          : uiCopy.completionFeedbackDialog.combinedEyebrow}
      </p>
      <h2 id="completion-title">
        {isFinal
          ? uiCopy.completionFeedbackDialog.finalTitle
          : uiCopy.completionFeedbackDialog.combinedTitle}
      </h2>
      <p>
        {isFinal
          ? uiCopy.completionFeedbackDialog.finalDescription
          : uiCopy.completionFeedbackDialog.combinedDescription(completedCount)}
      </p>
      <Button variant="primary" onClick={onContinue} data-modal-initial-focus>
        {isFinal
          ? uiCopy.completionFeedbackDialog.revealFinal
          : uiCopy.completionFeedbackDialog.viewCombined}
      </Button>
    </AppDialog>
  );
}
