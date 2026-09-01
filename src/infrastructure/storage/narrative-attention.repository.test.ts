import { describe, expect, it } from "vitest";
import {
  createNarrativeAttentionRepository,
  narrativeAttentionKey,
} from "./narrative-attention.repository";

describe("narrative attention repository", () => {
  it("stores opened narrative clues per player and assignment", () => {
    const repository = createNarrativeAttentionRepository(window.localStorage);

    repository.markOpened("alice", "assignment-1", "letter-1");
    repository.markOpened("alice", "assignment-1", "bless-1");

    expect(repository.load("alice", "assignment-1")).toEqual(
      new Set(["letter-1", "bless-1"]),
    );
    expect(repository.load("alice", "assignment-2")).toEqual(new Set());
  });

  it("recovers from malformed records", () => {
    window.localStorage.setItem(
      narrativeAttentionKey("alice", "assignment-1"),
      "not-json",
    );
    const repository = createNarrativeAttentionRepository(window.localStorage);

    expect(repository.load("alice", "assignment-1")).toEqual(new Set());
  });
});
