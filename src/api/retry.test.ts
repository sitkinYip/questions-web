import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { authState, gameRequest } from "@/api/game.client";
import { requestJson } from "@/api/request";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  authState.set(null);
});
const json = () => new Response(JSON.stringify({ ok: true }));

it("retries a command three times inside one promise, preserving the exact payload", async () => {
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new TypeError("offline"))
    .mockResolvedValueOnce(new Response("gateway", { status: 502 }))
    .mockResolvedValueOnce(new Response("busy", { status: 429 }))
    .mockImplementation(async () => json());
  vi.stubGlobal("fetch", fetcher);
  const result = gameRequest("/command", {
    method: "POST",
    body: { requestId: "same-key", answer: "draft" },
  });
  await vi.runAllTimersAsync();
  await expect(result).resolves.toEqual({ ok: true });
  expect(fetcher).toHaveBeenCalledTimes(4);
  expect(new Set(fetcher.mock.calls.map((call) => call[1].body)).size).toBe(1);
});

it.each([400, 401, 403, 404, 409, 410, 422])(
  "does not retry permanent HTTP %s even with a non-JSON body",
  async (status) => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("unavailable", { status }));
    vi.stubGlobal("fetch", fetcher);
    await expect(gameRequest("/assignment")).rejects.toMatchObject({ status });
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);

it("rejects only after all four attempts are exhausted", async () => {
  const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));
  vi.stubGlobal("fetch", fetcher);
  const assertion = expect(gameRequest("/me")).rejects.toMatchObject({
    code: "NETWORK_ERROR",
  });
  await vi.runAllTimersAsync();
  await assertion;
  expect(fetcher).toHaveBeenCalledTimes(4);
});

it("cancels during backoff without issuing another request", async () => {
  const controller = new AbortController();
  const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));
  vi.stubGlobal("fetch", fetcher);
  const assertion = expect(
    requestJson("/levels", { resource: "关卡", signal: controller.signal }),
  ).rejects.toMatchObject({ kind: "cancelled" });
  await vi.advanceTimersByTimeAsync(10);
  controller.abort();
  await vi.runAllTimersAsync();
  await assertion;
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it("does not replay a pending request after switching accounts", async () => {
  authState.set({ token: "old", playerId: "alice" });
  const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));
  vi.stubGlobal("fetch", fetcher);
  const assertion = expect(gameRequest("/me")).rejects.toMatchObject({
    code: "CANCELLED",
  });
  await vi.advanceTimersByTimeAsync(10);
  authState.set({ token: "new", playerId: "bob" });
  await vi.runAllTimersAsync();
  await assertion;
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("distinguishes timeout from cancellation across all attempts", async () => {
  const fetcher = vi.fn(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      }),
  );
  vi.stubGlobal("fetch", fetcher);
  const assertion = expect(gameRequest("/me")).rejects.toMatchObject({
    code: "TIMEOUT",
  });
  await vi.runAllTimersAsync();
  await assertion;
  expect(fetcher).toHaveBeenCalledTimes(4);
});
