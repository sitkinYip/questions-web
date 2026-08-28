/** Request deduplication IDs also work on the project's HTTP development domain. */
export function createRequestId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Unlike randomUUID, getRandomValues is available in an insecure context.
  // Keep cryptographic randomness; never fall back to Math.random or timestamps.
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
