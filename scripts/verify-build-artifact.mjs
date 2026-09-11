import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, sep } from "node:path";

const mode = process.argv[2];
assert(
  ["preview", "production"].includes(mode),
  "Expected preview or production",
);
const base = mode === "preview" ? "/questions-next/" : "/questions/";
const root = resolve("dist");
const entries =
  mode === "preview" ? ["index.html", "preview/index.html"] : ["index.html"];
for (const entry of entries) {
  const html = readFileSync(resolve(root, entry), "utf8");
  const assets = [
    ...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"?#]+)(?:[^"]*)"/g),
  ];
  assert(assets.length > 0, `${entry}: missing built assets`);
  for (const [, url] of assets) {
    assert(
      url.startsWith(`${base}assets/`),
      `${entry}: wrong asset base ${url}`,
    );
    const path = resolve(root, url.slice(base.length));
    assert(
      path.startsWith(`${root}${sep}`) && existsSync(path),
      `Missing asset ${url}`,
    );
  }
}
if (mode === "production")
  assert(
    !existsSync(resolve(root, "preview/index.html")),
    "Production contains editor entry",
  );
const info = JSON.parse(readFileSync(resolve(root, "version.json"), "utf8"));
assert.equal(
  info.commit,
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
);
assert(Number.isFinite(Date.parse(info.builtAt)), "Invalid build timestamp");
const release = process.env.QUESTIONS_RELEASE_NUMBER;
assert.equal(info.channel, release ? mode : "local");
assert.equal(
  info.version,
  release
    ? `1.${release}.${process.env.QUESTIONS_RELEASE_ATTEMPT}`
    : "0.0.0-local",
);
console.log(
  `${mode}: entry points, asset paths/files and release identity verified`,
);
