import { uiCopy } from "@/config/ui-copy";
import {
  CompassIcon,
  EnvelopeSimpleIcon,
  IdentificationCardIcon,
  SparkleIcon,
} from "@phosphor-icons/react";

export const gameNavigation = [
  {
    to: "/",
    label: uiCopy.gameNavigation.dashboard,
    description: uiCopy.gameNavigation.dashboardDescription,
    hint: uiCopy.gameNavigation.dashboardHint,
    Icon: CompassIcon,
  },
  {
    to: "/rewards",
    label: uiCopy.gameNavigation.rewards,
    description: uiCopy.gameNavigation.rewardsDescription,
    hint: uiCopy.gameNavigation.rewardsHint,
    Icon: SparkleIcon,
  },
  {
    to: "/notifications",
    label: uiCopy.gameNavigation.notifications,
    description: uiCopy.gameNavigation.notificationsDescription,
    hint: uiCopy.gameNavigation.notificationsHint,
    Icon: EnvelopeSimpleIcon,
  },
  {
    to: "/profile",
    label: uiCopy.gameNavigation.profile,
    description: uiCopy.gameNavigation.profileDescription,
    hint: uiCopy.gameNavigation.profileHint,
    Icon: IdentificationCardIcon,
  },
] as const;

export function gameReturnPath(
  pathname: string,
  state: unknown,
): string | undefined {
  const candidate =
    state && typeof state === "object" && "returnTo" in state
      ? state.returnTo
      : undefined;
  return (
    pathname.match(/^\/play\/[^/]+/)?.[0] ||
    (typeof candidate === "string" && /^\/play\/[^/]+$/.test(candidate)
      ? candidate
      : undefined)
  );
}
