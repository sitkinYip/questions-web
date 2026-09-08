import { z } from "zod";
import type { ExtraJson } from "./game.contracts";

const forbidden = new Set(["__proto__", "prototype", "constructor"]);
function safeJson(value: unknown, depth = 0): value is ExtraJson {
  if (depth > 6 || value === null) return false;
  if (typeof value === "string") return value.length <= 16384;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value))
    return value.length <= 50 && value.every((v) => safeJson(v, depth + 1));
  return (
    typeof value === "object" &&
    Object.keys(value).length <= 100 &&
    Object.entries(value).every(
      ([k, v]) => !forbidden.has(k) && safeJson(v, depth + 1),
    )
  );
}
// Invalid optional namespaces are isolated. The core game response remains strict.
export const extraSchema = z
  .unknown()
  .transform((input): Record<string, ExtraJson> => {
    if (!input || typeof input !== "object" || Array.isArray(input)) return {};
    const result: Record<string, ExtraJson> = {};
    let size = 0;
    for (const [key, value] of Object.entries(input).slice(0, 100)) {
      if (
        !/^[a-zA-Z][a-zA-Z0-9_]{0,59}$/.test(key) ||
        forbidden.has(key) ||
        !safeJson(value)
      )
        continue;
      const length = JSON.stringify(value).length;
      if (length > 16384 || size + length > 65536) continue;
      result[key] = value;
      size += length;
    }
    return result;
  });
const display = z.object({
  key: z.string().max(60),
  label: z.string().max(100),
  text: z.string().max(4000),
});
export const extraDisplaySchema = z.unknown().transform((input) => {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input.slice(0, 100).flatMap((item) => {
    const parsed = display.safeParse(item);
    if (!parsed.success || seen.has(parsed.data.key)) return [];
    seen.add(parsed.data.key);
    return [parsed.data];
  });
});
