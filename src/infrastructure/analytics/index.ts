import type { AnalyticsEvent } from "./events";
// The authenticated game records operations on its own backend. Reused visual
// components must never send answers, private clues or names to legacy telemetry,
// even when an old ?user= link or analytics environment setting is still present.
export function trackAnalytics(_event: AnalyticsEvent, _userId?: string) {
  return false;
}

export function trackAnalyticsOnce(
  _key: string,
  _event: AnalyticsEvent,
  _userId?: string,
) {
  return false;
}
