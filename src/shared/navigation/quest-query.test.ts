import { describe, expect, it } from "vitest";
import { parseQuestRoute } from "./quest-query";

describe("quest URL contract", () => {
  it("parses a single quest and user", () => {
    expect(parseQuestRoute("?qa=11&user=alice")).toEqual({
      steps: [11],
      userId: "alice",
      mode: "single",
    });
  });

  it("prefers a valid multi-quest list over qa", () => {
    expect(parseQuestRoute("?qa=11&qas=31,12,not-a-number&user=bob")).toEqual({
      steps: [31, 12],
      userId: "bob",
      mode: "multiple",
    });
  });

  it("falls back to step one for an invalid single quest", () => {
    expect(parseQuestRoute("?qa=invalid").steps).toEqual([1]);
  });
});
