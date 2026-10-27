import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { authState, gameApi, gameRequest } from "@/api/game.client";

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
  it("restores legacy authentication and does not resurrect it after logout", () => {
    const previous = { token: "previous-token", playerId: "alice" };
    localStorage.setItem("questions:v2:auth", JSON.stringify(previous));
    window.dispatchEvent(
      new StorageEvent("storage", { key: "questions:v2:auth" }),
    );
    expect(authState.get()).toEqual(previous);
    expect(
      JSON.parse(localStorage.getItem("starward:v2:auth") ?? "null"),
    ).toEqual(previous);
    expect(localStorage.getItem("questions:v2:auth")).toBeNull();

    // A stale tab may still hold an old-namespace record when the user logs out.
    localStorage.setItem("questions:v2:auth", JSON.stringify(previous));
    authState.set(null);
    expect(localStorage.getItem("starward:v2:auth")).toBeNull();
    expect(localStorage.getItem("questions:v2:auth")).toBeNull();
    window.dispatchEvent(
      new StorageEvent("storage", { key: "starward:v2:auth" }),
    );
    expect(authState.get()).toBeNull();
  });

  it("prefers canonical authentication when an old-namespace event arrives", () => {
    const current = { token: "new-token", playerId: "bob" };
    authState.set(current);
    localStorage.setItem(
      "questions:v2:auth",
      JSON.stringify({ token: "old-token", playerId: "alice" }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: "questions:v2:auth" }),
    );
    expect(authState.get()).toEqual(current);
  });

  it("shadows a legacy token when its removal is blocked during logout", () => {
    const previous = { token: "previous-token", playerId: "alice" };
    authState.set(previous);
    localStorage.setItem("questions:v2:auth", JSON.stringify(previous));
    const nativeRemove = Storage.prototype.removeItem;
    const remove = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(function (this: Storage, key: string) {
        if (key === "questions:v2:auth") throw new Error("cleanup blocked");
        nativeRemove.call(this, key);
      });
    try {
      authState.set(null);
      expect(localStorage.getItem("questions:v2:auth")).not.toBeNull();
      expect(localStorage.getItem("starward:v2:auth")).toBe("null");
      window.dispatchEvent(
        new StorageEvent("storage", { key: "starward:v2:auth" }),
      );
      expect(authState.get()).toBeNull();
    } finally {
      remove.mockRestore();
    }
  });

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
    expect(localStorage.getItem("starward:v2:auth")).not.toContain(
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
  const { createRequestId } = await import("@/shared/request-id");
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
