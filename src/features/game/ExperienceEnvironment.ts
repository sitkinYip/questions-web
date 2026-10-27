import { createContext, useContext } from "react";
import { trackAnalytics, trackAnalyticsOnce } from "@/infrastructure/analytics";

/** Side effects are supplied by the host; preview hosts use memory and no analytics. */
export interface ExperienceEnvironment {
  storage: Pick<Storage, "getItem" | "setItem"> &
    Partial<Pick<Storage, "removeItem">>;
  track: typeof trackAnalytics;
  trackOnce: typeof trackAnalyticsOnce;
}
const browserEnvironment: ExperienceEnvironment = {
  storage: {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  },
  track: trackAnalytics,
  trackOnce: trackAnalyticsOnce,
};
export const ExperienceEnvironmentContext = createContext(browserEnvironment);
export const useExperienceEnvironment = () =>
  useContext(ExperienceEnvironmentContext);
