import { describe, expect, it } from "vitest";
import { createBuildInfo } from "@scripts/build-info";

describe("release identity", () => {
  it("increments releases and retry attempts and retains the checked-out commit", () => {
    const build = (run: string, attempt: string) =>
      createBuildInfo(
        "preview",
        { STARWARD_RELEASE_NUMBER: run, STARWARD_RELEASE_ATTEMPT: attempt },
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
  it("accepts the complete legacy release namespace", () => {
    expect(
      createBuildInfo(
        "production",
        { QUESTIONS_RELEASE_NUMBER: "7", QUESTIONS_RELEASE_ATTEMPT: "2" },
        "legacy-checkout",
      ),
    ).toMatchObject({
      version: "1.7.2",
      channel: "production",
      commit: "legacy-checkout",
    });
  });
  it("prefers Starward release metadata when both namespaces exist", () => {
    expect(
      createBuildInfo(
        "preview",
        {
          STARWARD_RELEASE_NUMBER: "11",
          STARWARD_RELEASE_ATTEMPT: "3",
          QUESTIONS_RELEASE_NUMBER: "7",
          QUESTIONS_RELEASE_ATTEMPT: "2",
        },
        "checkout",
      ).version,
    ).toBe("1.11.3");
  });
  it("never combines a Starward release with a legacy retry attempt", () => {
    expect(() =>
      createBuildInfo(
        "preview",
        {
          STARWARD_RELEASE_NUMBER: "11",
          QUESTIONS_RELEASE_NUMBER: "7",
          QUESTIONS_RELEASE_ATTEMPT: "2",
        },
        "checkout",
      ),
    ).toThrow("Release number and attempt must be positive integers");
  });
  it("never presents local builds as deployed releases", () => {
    expect(createBuildInfo("production", {}, "local")).toMatchObject({
      version: "0.0.0-local",
      channel: "local",
    });
  });
  it("fails a release with invalid numbering", () => {
    expect(() =>
      createBuildInfo("preview", { STARWARD_RELEASE_NUMBER: "4" }, "sha"),
    ).toThrow();
  });
});
