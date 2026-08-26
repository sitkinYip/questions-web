import { withSafeQuery } from "../../domain/content/parser";
import { Button } from "../../components/ui/Button";
import type { QuestFinalDestination } from "../../domain/quest/types";
import { trackAnalytics } from "../../infrastructure/analytics";
import {
  resolveAppBasename,
  withAppBasename,
} from "../../shared/navigation/app-base";

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
    <aside className="final-destination" aria-label="最终旅程出口">
      <div>
        <p className="eyebrow">Passage unlocked</p>
        <strong>最终旅程入口已经开启</strong>
      </div>
      <div className="final-destination-actions">
        <Button variant="ghost" onClick={onDismiss}>
          稍后前往
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
            继续旅程
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
            继续旅程
          </a>
        )}
      </div>
    </aside>
  );
}
