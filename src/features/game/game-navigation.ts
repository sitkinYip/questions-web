import {
  CompassIcon,
  EnvelopeSimpleIcon,
  IdentificationCardIcon,
  SparkleIcon,
} from "@phosphor-icons/react";

export const gameNavigation = [
  {
    to: "/",
    label: "启程",
    description: "我的场次",
    hint: "继续未完的冒险",
    Icon: CompassIcon,
  },
  {
    to: "/rewards",
    label: "收藏",
    description: "奇遇收藏",
    hint: "收好线索与战利品",
    Icon: SparkleIcon,
  },
  {
    to: "/notifications",
    label: "来信",
    description: "旅途来信",
    hint: "查收远方的消息",
    Icon: EnvelopeSimpleIcon,
  },
  {
    to: "/profile",
    label: "护照",
    description: "冒险者护照",
    hint: "装扮你的冒险名片",
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
