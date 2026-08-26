import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(root, "src");
const stylesRoot = resolve(sourceRoot, "styles");
const entryPath = resolve(sourceRoot, "index.css");
const maxModuleLines = 650;

const expectedImports = [
  "foundation/tokens.css",
  "foundation/base.css",
  "components/controls-and-overlays.css",
  "layout/shell.css",
  "features/clues.css",
  "features/completion.css",
  "effects/quest-atmosphere.css",
  "features/quest.css",
  "effects/quest-lighting.css",
  "components/media-backdrop.css",
  "features/notifications.css",
  "components/audio-control.css",
  "components/media-viewer.css",
  "effects/archive-lighting.css",
  "effects/archive-keyframes.css",
  "effects/overlay-lighting.css",
  "effects/overlay-keyframes.css",
  "effects/answer-feedback.css",
  "features/records.css",
  "features/rank.css",
  "features/letter.css",
  "features/bless.css",
  "effects/keyframes.css",
  "effects/bless-keyframes.css",
];

async function collectCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectCssFiles(path)));
    if (entry.isFile() && entry.name.endsWith(".css")) files.push(path);
  }
  return files;
}

const failures = [];
const entry = await readFile(entryPath, "utf8");
const imports = [...entry.matchAll(/@import "\.\/styles\/(.+?)";/g)].map(
  ([, path]) => path,
);

if (
  entry
    .trim()
    .split("\n")
    .some((line) => !line.startsWith("@import "))
) {
  failures.push("src/index.css must remain an import-only composition root.");
}

if (JSON.stringify(imports) !== JSON.stringify(expectedImports)) {
  failures.push("src/index.css imports or cascade order changed unexpectedly.");
}

const files = await collectCssFiles(stylesRoot);
const relativeFiles = files
  .map((path) => path.slice(stylesRoot.length + 1))
  .sort();
const expectedFiles = [...expectedImports].sort();

if (JSON.stringify(relativeFiles) !== JSON.stringify(expectedFiles)) {
  failures.push(
    "Every src/styles CSS module must be explicitly owned and imported.",
  );
}

for (const file of files) {
  const css = await readFile(file, "utf8");
  const relative = file.slice(sourceRoot.length + 1);
  const lineCount = css.trimEnd().split("\n").length;

  if (lineCount > maxModuleLines) {
    failures.push(
      `${relative} has ${lineCount} lines (limit: ${maxModuleLines}).`,
    );
  }

  if (
    !relative.match(/styles\/effects\/(?:.+-)?keyframes\.css$/) &&
    /@keyframes\s/.test(css)
  ) {
    failures.push(
      `${relative} defines @keyframes outside an effects keyframes module.`,
    );
  }
}

const tokens = await readFile(
  resolve(stylesRoot, "foundation/tokens.css"),
  "utf8",
);
for (const token of [
  "--color-canvas",
  "--color-text",
  "--color-accent",
  "--color-border",
  "--motion-spring",
  "--z-overlay",
]) {
  if (!tokens.includes(`${token}:`))
    failures.push(`Missing required token ${token}.`);
}

if (failures.length > 0) {
  console.error(`Style architecture check failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(
    `Style architecture OK: ${files.length} modules, max ${maxModuleLines} lines each.`,
  );
}
