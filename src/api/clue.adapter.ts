import { classifySafeUrl, sanitizeMediaUrl } from "../domain/content/parser.ts";
import type { QuestClue } from "../domain/quest/types.ts";
import type { LevelRecord } from "./level.schema.ts";

type ThreadItem = LevelRecord["thread"][number];

function uniqueSafeMedia(values: readonly (string | null | undefined)[]) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => Boolean(value))
        .map(sanitizeMediaUrl)
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function internalHref(
  path: string | null | undefined,
  query?: Record<string, string> | null,
) {
  const safePath = path ? classifySafeUrl(path) : null;
  if (!safePath || safePath.target !== "internal") return null;
  const parameters = new URLSearchParams(query ?? {});
  const suffix = parameters.toString();
  return suffix ? `${safePath.href}?${suffix}` : safePath.href;
}

function baseClue(recordId: string, item: ThreadItem, index: number) {
  return {
    id: `${recordId}:clue:${index}`,
    title: item.title ?? undefined,
    content: item.content,
    autoPlay: item.state === "AutoPlay",
    imageUrls: [] as string[],
    tips: item.tips ?? undefined,
  };
}

export function adaptThreadItem(
  recordId: string,
  item: ThreadItem,
  index: number,
): QuestClue | null {
  const base = baseClue(recordId, item, index);

  if (item.type === "text") {
    return item.content ? { ...base, kind: "text" } : null;
  }

  if (item.type === "img") {
    const imageUrls = uniqueSafeMedia([item.url, ...item.imgList]);
    return imageUrls.length > 0 ? { ...base, kind: "image", imageUrls } : null;
  }

  if (item.type === "video") {
    const url = item.url ? sanitizeMediaUrl(item.url) : null;
    return url ? { ...base, kind: "video", url } : null;
  }

  if (item.type === "letter") {
    const href = internalHref(item.path, item.query);
    return href
      ? {
          ...base,
          kind: "letter",
          autoPlay: false,
          href,
          linkTarget: "internal",
        }
      : null;
  }

  const directLink = item.url ? classifySafeUrl(item.url) : null;
  const routeLink = internalHref(item.path, item.query);
  const link =
    directLink ??
    (routeLink ? { href: routeLink, target: "internal" as const } : null);
  return link
    ? {
        ...base,
        kind: "link",
        autoPlay: false,
        href: link.href,
        linkTarget: link.target,
      }
    : null;
}

export function adaptThread(record: LevelRecord): QuestClue[] {
  return record.thread
    .map((item, index) => adaptThreadItem(record.id, item, index))
    .filter((clue): clue is QuestClue => clue !== null);
}
