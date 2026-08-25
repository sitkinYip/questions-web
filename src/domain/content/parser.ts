import type { ContentSegment } from "./types.ts";

const tokenPattern =
  /\[\[.*?\]\]|\(\(.*?\|\|.*?\)\)(?!\))|\{\{.*?\}\}|<<.*?>>|\r?\n/gs;

export interface SafeUrl {
  href: string;
  target: "internal" | "external";
}

export function classifySafeUrl(rawUrl: string): SafeUrl | null {
  const value = rawUrl.trim();
  if (value.startsWith("/") && !value.startsWith("//")) {
    return { href: value, target: "internal" };
  }

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return { href: url.href, target: "external" };
    }
  } catch {
    return null;
  }
  return null;
}

export function sanitizeMediaUrl(rawUrl: string): string | null {
  return classifySafeUrl(rawUrl)?.href ?? null;
}

export function withSafeQuery(
  rawUrl: string,
  query: Readonly<Record<string, string>> = {},
): SafeUrl | null {
  const safeUrl = classifySafeUrl(rawUrl);
  if (!safeUrl) return null;
  const url = new URL(safeUrl.href, "https://questions.local");
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return safeUrl.target === "internal"
    ? { href: `${url.pathname}${url.search}${url.hash}`, target: "internal" }
    : { href: url.href, target: "external" };
}

function splitPair(value: string): [string, string] | null {
  const separatorIndex = value.indexOf("||");
  if (separatorIndex === -1) return null;
  return [value.slice(0, separatorIndex), value.slice(separatorIndex + 2)];
}

function parseToken(token: string): ContentSegment[] {
  if (token === "\n" || token === "\r\n") return [{ type: "break" }];

  if (token.startsWith("[[")) {
    const content = token.slice(2, -2);
    return content ? [{ type: "highlight", content }] : [];
  }

  if (token.startsWith("((")) {
    const pair = splitPair(token.slice(2, -2));
    if (!pair) return [{ type: "text", content: token }];
    const [content, rawUrl] = pair;
    const safeUrl = classifySafeUrl(rawUrl);
    return safeUrl && content
      ? [{ type: "link", content, ...safeUrl }]
      : [{ type: "text", content: content || token }];
  }

  if (token.startsWith("{{")) {
    const url = sanitizeMediaUrl(token.slice(2, -2));
    return url ? [{ type: "image", url }] : [];
  }

  if (token.startsWith("<<")) {
    const value = token.slice(2, -2);
    const pair = splitPair(value);
    const url = sanitizeMediaUrl(pair?.[0] ?? value);
    if (!url) return [];
    const poster = pair ? sanitizeMediaUrl(pair[1]) : null;
    return [{ type: "video", url, ...(poster ? { poster } : {}) }];
  }

  return [{ type: "text", content: token }];
}

export function parseLegacyContent(source: string): ContentSegment[] {
  if (!source) return [];

  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  for (const match of source.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", content: source.slice(lastIndex, index) });
    }
    segments.push(...parseToken(match[0]));
    lastIndex = index + match[0].length;
  }
  if (lastIndex < source.length) {
    segments.push({ type: "text", content: source.slice(lastIndex) });
  }
  return segments;
}
