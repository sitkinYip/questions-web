import { describe, expect, it } from "vitest";
import { resolveBlessReturnTo } from "@/features/bless/navigation";

describe("Bless return navigation", () => {
  it("prefers a safe returnTo and accepts the history fallback", () => {
    expect(
      resolveBlessReturnTo(
        "?from=final&returnTo=%2Fquestions-next%2F%3Fqa%3D42",
        "/ignored",
      ),
    ).toBe("/questions-next/?qa=42");
    expect(resolveBlessReturnTo("?from=final", "/?qa=42")).toBe("/?qa=42");
  });

  it("rejects external and dangerous return targets", () => {
    expect(
      resolveBlessReturnTo("?returnTo=https%3A%2F%2Fevil.example"),
    ).toBeNull();
    expect(resolveBlessReturnTo("?returnTo=javascript%3Aalert(1)")).toBeNull();
    expect(resolveBlessReturnTo("?returnTo=%2F%2Fevil.example")).toBeNull();
  });
});
