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
function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [
      name.toLowerCase(),
      value,
    ]),
  );
}
function publicAsset(url, label) {
  assert.equal(typeof url, "string", `${label}: missing URL`);
  assert(url.startsWith(base), `${label}: wrong public base ${url}`);
  const path = resolve(root, url.slice(base.length).split(/[?#]/)[0]);
  assert(
    path.startsWith(`${root}${sep}`) && existsSync(path),
    `${label}: missing public asset ${url}`,
  );
  return path;
}
function verifyPng(path, edge) {
  const image = readFileSync(path);
  assert(image.length >= 24, `${path}: truncated PNG`);
  assert(
    image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    `${path}: invalid PNG signature`,
  );
  assert.equal(
    image.toString("ascii", 12, 16),
    "IHDR",
    `${path}: missing IHDR`,
  );
  assert.equal(image.readUInt32BE(16), edge, `${path}: wrong PNG width`);
  assert.equal(image.readUInt32BE(20), edge, `${path}: wrong PNG height`);
}
const manifests = new Set();
for (const edge of [96, 192]) {
  verifyPng(
    publicAsset(`${base}branding/starward-mark-${edge}.png`, "page brand mark"),
    edge,
  );
}
const entries =
  mode === "preview" ? ["index.html", "preview/index.html"] : ["index.html"];
for (const entry of entries) {
  const html = readFileSync(resolve(root, entry), "utf8");
  assert(!/__UI_COPY_[A-Z_]+__/.test(html), `${entry}: unresolved UI metadata`);
  if (entry === "index.html") {
    assert.match(
      html,
      /<title>\s*赴星之约\s*<\/title>/,
      "Wrong application title",
    );
    const metadata = [...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) =>
      attributes(tag),
    );
    for (const name of ["application-name", "apple-mobile-web-app-title"])
      assert.equal(
        metadata.find((meta) => meta.name === name)?.content,
        "赴星之约",
        `${entry}: wrong ${name}`,
      );
  }
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) =>
    attributes(tag),
  );
  const requiredRels =
    entry === "index.html"
      ? ["icon", "apple-touch-icon", "manifest"]
      : ["icon"];
  for (const rel of requiredRels)
    assert(
      links.some((link) => link.rel?.split(/\s+/).includes(rel)),
      `${entry}: missing ${rel} link`,
    );
  for (const link of links) {
    const rels = link.rel?.split(/\s+/) ?? [];
    if (
      rels.some((rel) => ["icon", "apple-touch-icon", "manifest"].includes(rel))
    )
      publicAsset(link.href, `${entry}: ${link.rel}`);
    if (rels.includes("manifest")) manifests.add(link.href);
  }
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
for (const url of manifests) {
  const manifest = JSON.parse(
    readFileSync(publicAsset(url, "manifest"), "utf8"),
  );
  assert.equal(manifest.name, "赴星之约", "Wrong manifest name");
  assert.equal(manifest.short_name, "赴星之约", "Wrong manifest short name");
  for (const key of ["start_url", "scope", "id"])
    assert.equal(manifest[key], "./", `Wrong manifest ${key}`);
  assert(Array.isArray(manifest.icons), "Manifest is missing icons");
  const manifestUrl = new URL(url, "https://starward.invalid");
  for (const edge of [192, 512]) {
    const icon = manifest.icons.find(
      (image) => image.sizes === `${edge}x${edge}`,
    );
    assert(icon, `Manifest is missing ${edge}px icon`);
    assert.equal(icon.type, "image/png", "Wrong manifest icon type");
    assert.equal(typeof icon.src, "string", "Manifest icon is missing src");
    const iconUrl = new URL(icon.src, manifestUrl);
    assert.equal(iconUrl.origin, manifestUrl.origin, "External manifest icon");
    verifyPng(publicAsset(iconUrl.pathname, "manifest icon"), edge);
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
const isStarwardRelease = process.env.STARWARD_RELEASE_NUMBER !== undefined;
const release = isStarwardRelease
  ? process.env.STARWARD_RELEASE_NUMBER
  : process.env.QUESTIONS_RELEASE_NUMBER;
const attempt = isStarwardRelease
  ? process.env.STARWARD_RELEASE_ATTEMPT
  : process.env.QUESTIONS_RELEASE_ATTEMPT;
assert.equal(info.channel, release ? mode : "local");
assert.equal(info.version, release ? `1.${release}.${attempt}` : "0.0.0-local");
console.log(
  `${mode}: entry points, brand metadata/icons, asset paths/files and release identity verified`,
);
