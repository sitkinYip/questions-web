import { describe, expect, it } from "vitest";
import { resolveAppBasename, withAppBasename } from "./app-base";

describe("application basename", () => {
  it("uses the configured deployment base when it matches the URL", () => {
    expect(
      resolveAppBasename("/questions-next/", "/questions-next/bless"),
    ).toBe("/questions-next");
    expect(resolveAppBasename("/questions/", "/questions/?qa=52")).toBe(
      "/questions",
    );
  });

  it("detects a deployed subpath when a root build is served there", () => {
    expect(resolveAppBasename("/", "/questions-next/bless")).toBe(
      "/questions-next",
    );
    expect(resolveAppBasename("/", "/questions/letter")).toBe("/questions");
  });

  it("keeps local root routes unchanged", () => {
    expect(resolveAppBasename("/", "/bless")).toBe("/");
    expect(withAppBasename("/bless?from=final", "/")).toBe("/bless?from=final");
  });

  it("prefixes internal targets once", () => {
    expect(withAppBasename("/bless?from=final", "/questions-next")).toBe(
      "/questions-next/bless?from=final",
    );
    expect(
      withAppBasename("/questions-next/bless?from=final", "/questions-next/"),
    ).toBe("/questions-next/bless?from=final");
  });
});
