import { AppDialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { RitualParticles } from "../../components/effects/RitualParticles";
import { overlayPriority } from "../../components/ui/overlay-context";

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
      accessibleTitle={isFinal ? "所有迷雾已经消散" : "组合谜题全部破解"}
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
        {isFinal ? "Final covenant" : "Quest set complete"}
      </p>
      <h2 id="completion-title">
        {isFinal ? "所有迷雾已经消散" : "组合谜题全部破解"}
      </h2>
      <p>
        {isFinal
          ? "最终契约已经达成。接下来将依次揭示通关线索与旅程出口。"
          : `你已完成本次组合中的 ${completedCount} 道谜题。`}
      </p>
      <Button variant="primary" onClick={onContinue} data-modal-initial-focus>
        {isFinal ? "揭示最终线索" : "查看组合结果"}
      </Button>
    </AppDialog>
  );
}
