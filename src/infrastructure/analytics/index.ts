import { env } from "../../config/env";
import type { AnalyticsEvent } from "./events";
import {
  analyticsUserFromSearch,
  createAnalyticsClient,
  isAnalyticsAllowed,
} from "./client";

const client = createAnalyticsClient({
  enabled: isAnalyticsAllowed(
    env.VITE_ANALYTICS_ENABLED,
    import.meta.env.BASE_URL,
  ),
  endpoint: env.VITE_ANALYTICS_URL,
});

function routeAnalyticsUserId() {
  if (typeof window === "undefined") return undefined;
  return analyticsUserFromSearch(window.location.search);
}

export function trackAnalytics(event: AnalyticsEvent, _userId?: string) {
  return client.track(event, routeAnalyticsUserId());
}

export function trackAnalyticsOnce(
  key: string,
  event: AnalyticsEvent,
  _userId?: string,
) {
  return client.trackOnce(key, event, routeAnalyticsUserId());
}
