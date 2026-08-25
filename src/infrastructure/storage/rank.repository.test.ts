import { describe, expect, it } from "vitest";
import { createRankRepository, rankUpKey } from "./rank.repository";

describe("rank repository", () => {
  it("uses the legacy-compatible key and marks each user/rank once", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const repository = createRankRepository(storage);

    expect(rankUpKey("alice", "3")).toBe("rankUpShown_alice_3");
    expect(repository.hasShown("alice", "3")).toBe(false);
    repository.markShown("alice", "3");
    expect(repository.hasShown("alice", "3")).toBe(true);
    expect(repository.hasShown("bob", "3")).toBe(false);
  });
});
