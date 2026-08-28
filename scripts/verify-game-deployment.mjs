// Read-only deployment probe; local builds and UI tests do not run this script.
const raw = process.env.VITE_POCKETBASE_URL || "https://api.sitkin.top";
const url = new URL(raw);
if (
  url.protocol !== "https:" ||
  url.username ||
  url.password ||
  url.search ||
  url.hash ||
  url.pathname !== "/"
) {
  throw new Error(
    "The deployed PocketBase URL must be an HTTPS origin without credentials, path or query.",
  );
}
const response = await fetch(`${url.origin}/api/questions/v1/me`, {
  signal: AbortSignal.timeout(15000),
  redirect: "error",
});
if (response.status !== 401)
  throw new Error(
    `Backend v1 authentication endpoint probe failed: HTTP ${response.status}. No deployment performed.`,
  );
console.log(
  "Unauthenticated backend route probe passed; this is not a substitute for authenticated acceptance testing.",
);
