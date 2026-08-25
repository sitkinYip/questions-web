import { withSafeQuery } from "../../domain/content/parser";
import { Button } from "../../components/ui/Button";
import type { QuestFinalDestination } from "../../domain/quest/types";
import { trackAnalytics } from "../../infrastructure/analytics";

interface FinalDestinationPromptProps {
  destination: QuestFinalDestination | null;
  onDismiss: () => void;
  userId?: string;
}

export function FinalDestinationPrompt({
  destination,
  onDismiss,
  userId = "",
}: FinalDestinationPromptProps) {
  if (!destination) return null;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  const resolved = withSafeQuery(destination.href, { returnTo });
  if (!resolved) return null;

  return (
    <aside className="final-destination" aria-label="最终旅程出口">
      <div>
        <p className="eyebrow">Passage unlocked</p>
        <strong>最终旅程入口已经开启</strong>
      </div>
      <div className="final-destination-actions">
        <Button variant="ghost" onClick={onDismiss}>
          稍后前往
        </Button>
        <a
          className="primary-action"
          href={resolved.href}
          {...(resolved.target === "external"
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          onClick={() =>
            trackAnalytics(
              {
                name: "destination_opened",
                target: resolved.target,
                href: resolved.href,
              },
              userId,
            )
          }
        >
          继续旅程
        </a>
      </div>
    </aside>
  );
}
