import { z } from "zod";
import {
  gameAnswerSchema,
  gameAssignmentSchema,
  gameAssignmentSummarySchema,
  gameNotificationSchema,
  gamePlayerSchema,
  gameRewardSchema,
  listOf,
} from "./game.schema";

export const pocketBaseUrl = (
  import.meta.env.VITE_POCKETBASE_URL || "https://api.sitkin.top"
).replace(/\/$/, "");
const storageKey = "questions:v2:auth";
const authSchema = z.object({ token: z.string(), playerId: z.string() });
type Auth = z.infer<typeof authSchema>;
function loadAuth(): Auth | null {
  try {
    return authSchema.parse(
      JSON.parse(localStorage.getItem(storageKey) || "null"),
    );
  } catch {
    return null;
  }
}
let auth: Auth | null = loadAuth();
const listeners = new Set<() => void>();
export const authState = {
  get: () => auth,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set(value: Auth | null) {
    auth = value;
    try {
      if (value) localStorage.setItem(storageKey, JSON.stringify(value));
      else localStorage.removeItem(storageKey);
    } catch {
      /* In-memory login remains usable. */
    }
    for (const listener of listeners) listener();
  },
};
window.addEventListener("storage", (event) => {
  if (event.key === storageKey) {
    auth = loadAuth();
    for (const listener of listeners) listener();
  }
});

export class GameApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export async function gameRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    schema?: z.ZodType<T>;
    publicPath?: boolean;
    token?: string;
  } = {},
): Promise<T> {
  const token = options.token ?? auth?.token;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(abort, 15000);
  try {
    const form = options.body instanceof FormData;
    const response = await fetch(
      `${pocketBaseUrl}${options.publicPath ? path : `/api/questions/v1${path}`}`,
      {
        method: options.method || "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: token } : {}),
          ...(options.body && !form
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body: form
          ? (options.body as FormData)
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
        signal: controller.signal,
      },
    );
    const data = await response.json();
    if (!response.ok) {
      if (
        response.status === 401 &&
        auth?.token === token &&
        !options.publicPath
      )
        authState.set(null);
      throw new GameApiError(
        data.error?.code || "REQUEST_FAILED",
        data.error?.message ||
          (response.status === 401
            ? "账号或密码不正确"
            : "请求失败，请检查输入或联系工作人员"),
        response.status,
      );
    }
    if (!options.publicPath && !options.token && token !== auth?.token)
      throw new GameApiError("CANCELLED", "账号已切换");
    if (options.schema) {
      const parsed = options.schema.safeParse(data);
      if (!parsed.success)
        throw new GameApiError(
          "CONTRACT_ERROR",
          "服务端数据版本不匹配，请联系管理员",
        );
      return parsed.data;
    }
    return data as T;
  } catch (error) {
    if (error instanceof GameApiError) throw error;
    if (options.signal?.aborted)
      throw new GameApiError("CANCELLED", "请求已取消");
    throw new GameApiError(
      "NETWORK_ERROR",
      "连接中断，提交可能已生效；请重试原操作确认结果",
    );
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
export const gameApi = {
  async login(account: string, password: string) {
    const result = await gameRequest<{ token: string; record: { id: string } }>(
      "/api/collections/game_players/auth-with-password",
      {
        publicPath: true,
        method: "POST",
        body: { identity: account.trim().toLowerCase(), password },
        schema: z.object({
          token: z.string(),
          record: z.object({ id: z.string() }),
        }),
      },
    );
    const player = await gameRequest("/me", {
      token: result.token,
      schema: gamePlayerSchema,
    });
    authState.set({ token: result.token, playerId: player.id });
    return player;
  },
  me: (signal?: AbortSignal) =>
    gameRequest("/me", { signal, schema: gamePlayerSchema }),
  assignments: (signal?: AbortSignal) =>
    gameRequest("/assignments", {
      signal,
      schema: listOf(gameAssignmentSummarySchema),
    }),
  assignment: (id: string, signal?: AbortSignal) =>
    gameRequest(`/assignments/${encodeURIComponent(id)}`, {
      signal,
      schema: gameAssignmentSchema,
    }),
  start: (id: string, requestId: string) =>
    gameRequest(`/assignments/${encodeURIComponent(id)}/start`, {
      method: "POST",
      body: { requestId },
      schema: gameAssignmentSchema,
    }),
  answer: (
    id: string,
    sessionLevelId: string,
    answer: string,
    requestId: string,
  ) =>
    gameRequest(`/assignments/${encodeURIComponent(id)}/answers`, {
      method: "POST",
      body: { sessionLevelId, answer, requestId },
      schema: gameAnswerSchema,
    }),
  rewards: (signal?: AbortSignal) =>
    gameRequest("/rewards", { signal, schema: listOf(gameRewardSchema) }),
  notifications: (signal?: AbortSignal) =>
    gameRequest("/notifications", {
      signal,
      schema: listOf(gameNotificationSchema),
    }),
  readNotification: (id: string) =>
    gameRequest(`/notifications/${encodeURIComponent(id)}/read`, {
      method: "POST",
      body: {},
    }),
  profile: (body: FormData) =>
    gameRequest("/me/profile", {
      method: "PATCH",
      body,
      schema: gamePlayerSchema,
    }),
  async changePassword(
    oldPassword: string,
    password: string,
    passwordConfirm: string,
  ) {
    const result = await gameRequest("/me/change-password", {
      method: "POST",
      body: { oldPassword, password, passwordConfirm },
      schema: z.object({ token: z.string(), player: gamePlayerSchema }),
    });
    authState.set({ token: result.token, playerId: result.player.id });
    return result.player;
  },
};
