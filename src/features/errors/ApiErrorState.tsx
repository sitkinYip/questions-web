import { uiCopy } from "@/config/ui-copy";
import { getApiErrorPresentation } from "@/api/errors";
import { Button } from "@/components/ui/Button";

interface ApiErrorStateProps {
  error: unknown;
  onRetry: () => void;
  variant?: "quest" | "letter";
}

export function ApiErrorState({
  error,
  onRetry,
  variant = "quest",
}: ApiErrorStateProps) {
  const presentation = getApiErrorPresentation(error);
  return (
    <main
      className={
        variant === "letter" ? "letter-state" : "centered-state error-state"
      }
      data-error-kind={
        error && typeof error === "object" && "kind" in error
          ? String(error.kind)
          : "unknown"
      }
    >
      <p className="eyebrow">{presentation.eyebrow}</p>
      <h1>{presentation.title}</h1>
      <p>{presentation.detail}</p>
      {presentation.retryable && (
        <Button variant="primary" onClick={onRetry}>
          {uiCopy.apiErrorState.retry}
        </Button>
      )}
    </main>
  );
}
