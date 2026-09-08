import { uiCopy } from "@/config/ui-copy";
import { withSafeQuery } from "@/domain/content/parser";
import { Button } from "@/components/ui/Button";
import type { QuestFinalDestination } from "@/domain/quest/types";
import { trackAnalytics } from "@/infrastructure/analytics";
import {
  resolveAppBasename,
  withAppBasename,
} from "@/shared/navigation/app-base";

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
  const appBasename = resolveAppBasename(
    import.meta.env.BASE_URL,
    window.location.pathname,
  );

  return (
    <aside
      className="final-destination"
      aria-label={uiCopy.finalDestinationPrompt.label}
    >
      <div>
        <p className="eyebrow">{uiCopy.finalDestinationPrompt.eyebrow}</p>
        <strong>{uiCopy.finalDestinationPrompt.title}</strong>
      </div>
      <div className="final-destination-actions">
        <Button variant="ghost" onClick={onDismiss}>
          {uiCopy.finalDestinationPrompt.later}
        </Button>
        {resolved.target === "internal" ? (
          <a
            className="primary-action"
            href={withAppBasename(resolved.href, appBasename)}
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
            {uiCopy.finalDestinationPrompt.continueJourney}
          </a>
        ) : (
          <a
            className="primary-action"
            href={resolved.href}
            target="_blank"
            rel="noopener noreferrer"
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
            {uiCopy.finalDestinationPrompt.continueJourney}
          </a>
        )}
      </div>
    </aside>
  );
}
