import { describe, expect, it } from "vitest";
import { resolveLetterReturnTo } from "./navigation";

describe("Letter return navigation", () => {
  it("prefers a safe returnTo query and accepts the history fallback", () => {
    expect(
      resolveLetterReturnTo(
        "?from=alice&returnTo=%2F%3Fqas%3D11%2C12",
        "/fallback",
      ),
    ).toBe("/?qas=11,12");
    expect(resolveLetterReturnTo("?from=alice", "/?qa=52")).toBe("/?qa=52");
  });

  it("rejects external and unsafe return targets", () => {
    expect(
      resolveLetterReturnTo("?returnTo=https%3A%2F%2Fevil.example"),
    ).toBeNull();
    expect(resolveLetterReturnTo("?returnTo=javascript%3Aalert(1)")).toBeNull();
  });
});
