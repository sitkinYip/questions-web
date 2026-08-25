import { env } from "../../config/env";
import type { AnalyticsEvent } from "./events";
import { createAnalyticsClient, isAnalyticsAllowed } from "./client";

const client = createAnalyticsClient({
  enabled: isAnalyticsAllowed(
    env.VITE_ANALYTICS_ENABLED,
    import.meta.env.BASE_URL,
  ),
  endpoint: env.VITE_ANALYTICS_URL,
});

export function trackAnalytics(event: AnalyticsEvent, userId?: string) {
  return client.track(event, userId);
}

export function trackAnalyticsOnce(
  key: string,
  event: AnalyticsEvent,
  userId?: string,
) {
  return client.trackOnce(key, event, userId);
}
