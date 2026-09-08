import { classifySafeUrl } from "@/domain/content/parser";

export function resolveLetterReturnTo(
  search: string,
  historyBack?: unknown,
): string | null {
  const fromQuery = new URLSearchParams(search).get("returnTo");
  const candidate =
    fromQuery || (typeof historyBack === "string" ? historyBack : "");
  const safeUrl = candidate ? classifySafeUrl(candidate) : null;
  return safeUrl?.target === "internal" ? safeUrl.href : null;
}
