import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { authState, gameApi, gameRequest } from "./game.client";

const player = {
  id: "alice",
  account: "alice",
  displayName: "同名玩家",
  avatar: "",
  mustChangePassword: false,
  totalXp: 0,
  level: {
    id: "rank1",
    order: 1,
    name: "初见",
    minTotalXp: 0,
    visualConfig: {},
  },
  nextLevel: null,
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
beforeEach(() => authState.set(null));
afterEach(() => {
  authState.set(null);
  vi.unstubAllGlobals();
});

describe("authenticated game transport", () => {
  it("logs in with the account, validates the profile, and never stores the password", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        json({ token: "alice-token", record: { id: "alice" } }),
      )
      .mockResolvedValueOnce(json(player));
    vi.stubGlobal("fetch", fetcher);
    expect(await gameApi.login(" Alice ", "private-password")).toEqual(player);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      identity: "alice",
      password: "private-password",
    });
    expect(authState.get()).toEqual({
      token: "alice-token",
      playerId: "alice",
    });
    expect(localStorage.getItem("questions:v2:auth")).not.toContain(
      "private-password",
    );
  });
  it("rejects incompatible server data before establishing a login", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          json({ token: "token", record: { id: "alice" } }),
        )
        .mockResolvedValueOnce(json({ id: "alice" })),
    );
    await expect(gameApi.login("alice", "password")).rejects.toMatchObject({
      code: "CONTRACT_ERROR",
    });
    expect(authState.get()).toBeNull();
  });
  it("drops successful responses from a previous account", async () => {
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ),
    );
    authState.set({ token: "old-token", playerId: "alice" });
    const result = gameRequest("/me");
    authState.set({ token: "new-token", playerId: "bob" });
    finish(json(player));
    await expect(result).rejects.toMatchObject({ code: "CANCELLED" });
  });
  it("does not log out the current account when an old request returns 401", async () => {
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ),
    );
    authState.set({ token: "old-token", playerId: "alice" });
    const result = gameRequest("/me");
    authState.set({ token: "new-token", playerId: "bob" });
    finish(json({}, 401));
    await expect(result).rejects.toMatchObject({ status: 401 });
    expect(authState.get()?.playerId).toBe("bob");
  });
  it("revokes the current client session on unauthorized responses", async () => {
    authState.set({ token: "token", playerId: "alice" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 401)));
    await expect(gameRequest("/me")).rejects.toMatchObject({ status: 401 });
    expect(authState.get()).toBeNull();
  });
  it("keeps the caller's idempotency key unchanged on retries", async () => {
    authState.set({ token: "token", playerId: "alice" });
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(json({ ok: true })));
    vi.stubGlobal("fetch", fetcher);
    const options = {
      method: "POST",
      body: { requestId: "same-request", answer: "答案" },
      schema: z.object({ ok: z.boolean() }),
    };
    await gameRequest("/command", options);
    await gameRequest("/command", options);
    expect(fetcher.mock.calls[0][1].body).toEqual(
      fetcher.mock.calls[1][1].body,
    );
  });
  it("sends nickname-only profile edits as JSON", async () => {
    authState.set({ token: "token", playerId: "alice" });
    const fetcher = vi
      .fn()
      .mockResolvedValue(json({ ...player, displayName: "新昵称" }));
    vi.stubGlobal("fetch", fetcher);
    const form = new FormData();
    form.set("displayName", "新昵称");

    expect((await gameApi.profile(form)).displayName).toBe("新昵称");
    expect(fetcher.mock.calls[0][0]).toMatch(/\/me\/profile$/);
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "token" },
      body: JSON.stringify({ displayName: "新昵称" }),
    });
  });
  it("keeps avatar uploads multipart and lets the browser set the boundary", async () => {
    const fetcher = vi.fn().mockResolvedValue(json(player));
    vi.stubGlobal("fetch", fetcher);
    const form = new FormData();
    form.set("displayName", "新昵称");
    form.set(
      "avatar",
      new File(["image"], "avatar.png", { type: "image/png" }),
    );

    await gameApi.profile(form);
    expect(fetcher.mock.calls[0][1].body).toBe(form);
    expect(fetcher.mock.calls[0][1].headers).not.toHaveProperty("Content-Type");
  });
});

it("creates cryptographic request IDs on the original HTTP development domain", async () => {
  const { createRequestId } = await import("../shared/request-id");
  const original = Object.getOwnPropertyDescriptor(crypto, "randomUUID");
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: undefined,
  });
  try {
    const first = createRequestId();
    expect(first).toMatch(/^[a-f0-9]{32}$/);
    expect(createRequestId()).not.toBe(first);
  } finally {
    if (original) Object.defineProperty(crypto, "randomUUID", original);
    else delete (crypto as Partial<Crypto>).randomUUID;
  }
});
