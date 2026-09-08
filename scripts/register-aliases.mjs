// Native Node scripts do not resolve TypeScript paths; use the same mappings.
import { registerHooks } from "node:module";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const { compilerOptions } = JSON.parse(
  readFileSync(resolve(root, "tsconfig.json"), "utf8"),
);
const aliases = Object.entries(compilerOptions.paths).map(([key, targets]) => [
  key.slice(0, -1),
  targets[0].slice(0, -1),
]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const alias = aliases.find(([prefix]) => specifier.startsWith(prefix));
    if (!alias) return nextResolve(specifier, context);
    const [prefix, directory] = alias;
    const target = resolve(root, directory, specifier.slice(prefix.length));
    for (const suffix of [
      "",
      ".ts",
      ".tsx",
      ".js",
      ".mjs",
      "/index.ts",
      "/index.js",
    ]) {
      const candidate = target + suffix;
      if (statSync(candidate, { throwIfNoEntry: false })?.isFile()) {
        return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
    return nextResolve(pathToFileURL(target).href, context);
  },
});
