import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getApiErrorPresentation } from "./errors";
import { requestJson } from "./request";

describe("API request error classification", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("classifies HTTP and invalid JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("down", { status: 503 })),
    );
    await expect(
      requestJson("https://api.example/levels", {
        resource: "关卡",
        timeoutMs: 100,
      }),
    ).rejects.toMatchObject({ kind: "http", status: 503 });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json")));
    await expect(
      requestJson("https://api.example/levels", {
        resource: "关卡",
        timeoutMs: 100,
      }),
    ).rejects.toMatchObject({ kind: "contract", status: 200 });
  });

  it("distinguishes network failure from caller cancellation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(
      requestJson("https://api.example/levels", { resource: "关卡" }),
    ).rejects.toMatchObject({ kind: "network" });

    const controller = new AbortController();
    controller.abort();
    await expect(
      requestJson("https://api.example/levels", {
        resource: "关卡",
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ kind: "cancelled" });
  });

  it("aborts a request at the configured timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(init.signal?.reason),
            );
          }),
      ),
    );
    const request = requestJson("https://api.example/levels", {
      resource: "关卡",
      timeoutMs: 250,
    });
    const assertion = expect(request).rejects.toMatchObject({
      kind: "timeout",
    });
    await vi.advanceTimersByTimeAsync(250);
    await assertion;
  });

  it("maps contract and permission failures to different UI actions", () => {
    expect(
      getApiErrorPresentation(new ApiError("contract", "字段不兼容")),
    ).toMatchObject({ title: "数据格式发生变化", retryable: false });
    expect(
      getApiErrorPresentation(
        new ApiError("http", "拒绝访问", { status: 403 }),
      ),
    ).toMatchObject({ title: "数据服务拒绝访问", retryable: false });
    expect(
      getApiErrorPresentation(new ApiError("timeout", "超时")),
    ).toMatchObject({ title: "连接等待超时", retryable: true });
  });
});
