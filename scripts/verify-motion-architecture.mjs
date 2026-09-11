import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const failures = [];
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (path.endsWith(".css")) files.push(path);
  }
  return files;
}
function selectors(value) {
  let depth = 0,
    start = 0;
  const result = [];
  for (let index = 0; index < value.length; index++) {
    if (value[index] === "(" || value[index] === "[") depth++;
    if (value[index] === ")" || value[index] === "]") depth--;
    if (value[index] === "," && depth === 0) {
      result.push(value.slice(start, index));
      start = index + 1;
    }
  }
  result.push(value.slice(start));
  return result;
}
const surfaceNames = new Set([
  "ui-sheet",
  "clue-dialog",
  "multi-clue-dialog",
  "notification-dialog",
  "media-viewer",
  "rank-up-dialog",
  "completion-dialog",
  "version-dialog",
  "record-confirm",
  "avatar-crop-dialog",
  "game-retry-dialog",
]);
for (const file of await walk(resolve(root, "src"))) {
  if (file.endsWith("/components/motion.css")) continue;
  const css = await readFile(file, "utf8");
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/\banimation(?:-name)?:/.test(body)) continue;
    if (/animation:\s*none\s*;/.test(body)) continue;
    for (const item of selectors(selector)) {
      const match = item.trim().match(/^\.([\w-]+)(?:\[[^\]]+\])*$/);
      if (match && surfaceNames.has(match[1]))
        failures.push(
          `${file.slice(root.length + 1)} overrides outer motion for ${item.trim()}`,
        );
    }
  }
}
const motion = await readFile(
  resolve(root, "src/styles/components/motion.css"),
  "utf8",
);
for (const name of [
  "motion-surface-enter",
  "motion-surface-exit",
  "motion-backdrop-enter",
  "motion-backdrop-exit",
]) {
  if (!motion.includes(name)) failures.push(`Missing shared motion ${name}`);
}
for (const side of ["left", "right", "bottom"]) {
  if (!motion.includes(`[data-placement="${side}"]`))
    failures.push(`Missing placement ${side}`);
}
if (!motion.includes("prefers-reduced-motion"))
  failures.push("Missing reduced-motion contract");
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "Motion architecture OK: paired transitions, placements and surface ownership.",
  );
