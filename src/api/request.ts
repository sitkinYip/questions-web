import { ApiError } from "./errors";
import { withSilentRetry, isTransientStatus } from "./retry";

interface RequestJsonOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  resource: string;
}

export function requestJson(url: string, options: RequestJsonOptions) {
  return withSilentRetry(() => requestJsonAttempt(url, options), {
    signal: options.signal,
    cancelled: () => new ApiError("cancelled", `已取消加载${options.resource}`),
    shouldRetry: (error) =>
      error instanceof ApiError &&
      (error.kind === "network" ||
        error.kind === "timeout" ||
        (error.kind === "http" && isTransientStatus(error.status ?? 0))),
  });
}

async function requestJsonAttempt(
  url: string,
  { signal, timeoutMs = 10_000, resource }: RequestJsonOptions,
): Promise<{ data: unknown; status: number }> {
  const controller = new AbortController();
  let timedOut = false;
  const handleExternalAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) handleExternalAbort();
  else signal?.addEventListener("abort", handleExternalAbort, { once: true });
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException("Request timed out", "TimeoutError"));
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok)
      throw new ApiError("http", `无法加载${resource}`, {
        status: response.status,
      });
    try {
      return { data: await response.json(), status: response.status };
    } catch (error) {
      if (controller.signal.aborted || error instanceof TypeError) throw error;
      throw new ApiError("contract", `${resource}返回了无效 JSON`, {
        status: response.status,
        cause: error,
      });
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut)
      throw new ApiError("timeout", `加载${resource}超时`, { cause: error });
    if (signal?.aborted)
      throw new ApiError("cancelled", `已取消加载${resource}`, {
        cause: error,
      });
    if (error instanceof TypeError)
      throw new ApiError("network", `无法连接${resource}`, { cause: error });
    throw new ApiError("unknown", `加载${resource}失败`, { cause: error });
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", handleExternalAbort);
  }
}

export function contractError(
  resource: string,
  status: number,
  cause: unknown,
) {
  return new ApiError("contract", `${resource}返回了不兼容的数据`, {
    status,
    cause,
  });
}
