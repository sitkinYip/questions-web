import { describe, expect, it } from "vitest";
import { createBuildInfo } from "../../scripts/build-info";

describe("release identity", () => {
  it("increments releases and retry attempts and retains the checked-out commit", () => {
    const build = (run: string, attempt: string) =>
      createBuildInfo(
        "preview",
        { QUESTIONS_RELEASE_NUMBER: run, QUESTIONS_RELEASE_ATTEMPT: attempt },
        "actual-checkout",
      );
    expect(build("21", "1").version).toBe("1.21.1");
    expect(build("22", "1").version).toBe("1.22.1");
    expect(build("22", "2")).toMatchObject({
      version: "1.22.2",
      commit: "actual-checkout",
      channel: "preview",
    });
  });
  it("never presents local builds as deployed releases", () => {
    expect(createBuildInfo("production", {}, "local")).toMatchObject({
      version: "0.0.0-local",
      channel: "local",
    });
  });
  it("fails a release with invalid numbering", () => {
    expect(() =>
      createBuildInfo("preview", { QUESTIONS_RELEASE_NUMBER: "4" }, "sha"),
    ).toThrow();
  });
});
